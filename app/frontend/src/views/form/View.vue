<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBOTH]">
    <FormSubmission :submissionId="s" />
  </BaseSecure>
</template>

<script>
import { defineComponent } from 'vue';

import FormSubmission from '@/components/forms/FormSubmission.vue';
import { IdentityProviders } from '@/utils/constants';

export default defineComponent({
  name: 'FormView',

  props: {
    s: String,
  },

  components: {
    FormSubmission,
  },

  computed: {
    IDP: () => IdentityProviders,
  },
});
</script>
