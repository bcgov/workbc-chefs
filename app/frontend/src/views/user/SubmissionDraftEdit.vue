<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBOTH]">
    <UserSubmission
      :saved="sv"
      :submissionId="s"
      :readOnly="false"
      :draft="true"
    />
  </BaseSecure>
</template>

<script>
import UserSubmission from '@/components/forms/submission/UserSubmission.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'SubmissionDraftEdit',
  components: {
    UserSubmission,
  },
  props: {
    s: String,
    sv: Boolean,
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
