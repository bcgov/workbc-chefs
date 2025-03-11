<template>
  <FormViewer :formId="f" :bulkState="b" displayTitle />
</template>

<script>
import { defineComponent } from 'vue';

import FormViewer from '~/components/designer/FormViewer.vue';

export default defineComponent({
  name: 'FormSubmit',

  components: {
    FormViewer,
  },

  props: {
    f: String,
    b: String,
  },
});
</script>
