<template>
  <UserDuplicateSubmission
    :saved="sv"
    :submissionId="s"
    :formId="f"
    :readOnly="false"
  />
</template>

<script>
import { defineComponent } from 'vue';

import UserDuplicateSubmission from '~/components/forms/submission/UserDuplicateSubmission.vue';
export default defineComponent({
  name: 'SubmissionDuplicate',

  components: {
    UserDuplicateSubmission,
  },

  props: {
    s: String,
    f: String,
    sv: Boolean,
  },
});
</script>
