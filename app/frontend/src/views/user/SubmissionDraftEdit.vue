<template>
  <UserSubmission
    :saved="sv"
    :submissionId="s"
    :readOnly="false"
    :draft="true"
  />
</template>

<script>
import { defineComponent } from 'vue';

import UserSubmission from '@/components/forms/submission/UserSubmission.vue';

export default defineComponent({
  name: 'SubmissionDraftEdit',

  components: {
    UserSubmission,
  },

  props: {
    s: String,
    sv: Boolean,
  },
});
</script>
