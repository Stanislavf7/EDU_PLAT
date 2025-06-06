<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { basicSetup } from 'codemirror';

const props = defineProps({
  modelValue: { type: String, default: '' },
  readOnly: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const editorRef = ref(null);
let editorView = null;

onMounted(() => {
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      cpp(),
      keymap.of(defaultKeymap),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
      EditorView.editable.of(!props.readOnly),
      props.readOnly ? EditorView.theme({ '&': { backgroundColor: '#f5f5f5' } }) : []
    ]
  });

  editorView = new EditorView({
    state,
    parent: editorRef.value
  });
});

watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: newValue }
    });
  }
});

onUnmounted(() => {
  if (editorView) {
    editorView.destroy();
  }
});
</script>

<template>
  <div ref="editorRef" class="codemirror-editor"></div>
</template>

<style scoped>
.codemirror-editor {
  border: 1px solid #cedae8;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
  min-height: 200px;
  text-align: left;
}

:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-content) {
  font-family: 'Consolas', 'Monaco', monospace;
}

:deep(.cm-focused) {
  outline: none;
}
</style>
