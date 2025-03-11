<template>
  <FormSubmission :submissionId="s" />
</template>

<script>
import { defineComponent } from 'vue';

import FormSubmission from '@/components/forms/submission/UserSubmission.vue';

export default defineComponent({
  name: 'UserSubmissionView',

  props: {
    s: {
      type: String,
      required: true,
    },
  },

  components: {
    FormSubmission,
  },
});
</script>
