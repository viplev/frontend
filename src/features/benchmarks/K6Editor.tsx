import { basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { useEffect, useRef } from 'react'

interface K6EditorProps {
  id: string
  value: string
  disabled: boolean
  hasError: boolean
  ariaDescribedBy?: string
  onChange: (nextValue: string) => void
  onFocusChange: (hasFocus: boolean) => void
  onEditorReady: (view: EditorView | null) => void
}

export function K6Editor({
  id,
  value,
  disabled,
  hasError,
  ariaDescribedBy,
  onChange,
  onFocusChange,
  onEditorReady,
}: K6EditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onFocusChangeRef = useRef(onFocusChange)
  const onEditorReadyRef = useRef(onEditorReady)
  const editableCompartmentRef = useRef(new Compartment())
  const readOnlyCompartmentRef = useRef(new Compartment())
  const contentAttributesCompartmentRef = useRef(new Compartment())

  useEffect(() => {
    onChangeRef.current = onChange
    onFocusChangeRef.current = onFocusChange
    onEditorReadyRef.current = onEditorReady
  }, [onChange, onEditorReady, onFocusChange])

  useEffect(() => {
    if (!hostRef.current) return

    const editableCompartment = editableCompartmentRef.current
    const readOnlyCompartment = readOnlyCompartmentRef.current
    const contentAttributesCompartment = contentAttributesCompartmentRef.current

    const editor = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          javascript(),
          EditorView.lineWrapping,
          editableCompartment.of(EditorView.editable.of(true)),
          readOnlyCompartment.of(EditorState.readOnly.of(false)),
          contentAttributesCompartment.of(EditorView.contentAttributes.of({})),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString())
            }
            if (update.focusChanged) {
              onFocusChangeRef.current(update.view.hasFocus)
            }
          }),
        ],
      }),
      parent: hostRef.current,
    })

    viewRef.current = editor
    onEditorReadyRef.current(editor)

    return () => {
      onEditorReadyRef.current(null)
      viewRef.current = null
      editor.destroy()
    }
  }, [])

  useEffect(() => {
    const editor = viewRef.current
    if (!editor) return
    const currentValue = editor.state.doc.toString()
    if (currentValue === value) return
    editor.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    })
  }, [value])

  useEffect(() => {
    const editor = viewRef.current
    if (!editor) return
    editor.dispatch({
      effects: [
        editableCompartmentRef.current.reconfigure(EditorView.editable.of(!disabled)),
        readOnlyCompartmentRef.current.reconfigure(EditorState.readOnly.of(disabled)),
      ],
    })
  }, [disabled])

  useEffect(() => {
    const editor = viewRef.current
    if (!editor) return
    editor.dispatch({
      effects: contentAttributesCompartmentRef.current.reconfigure(
        EditorView.contentAttributes.of({
          id,
          'aria-invalid': hasError ? 'true' : 'false',
          ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
        }),
      ),
    })
  }, [ariaDescribedBy, hasError, id])

  return (
    <div className={`k6-editor${hasError ? ' k6-editor--error' : ''}`}>
      <div ref={hostRef} />
    </div>
  )
}
