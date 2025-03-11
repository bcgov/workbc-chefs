<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBOTH]">
    <SubmissionsTable :formId="f" />
  </BaseSecure>
</template>

<script>
import { defineComponent } from 'vue';

import SubmissionsTable from '@/components/forms/SubmissionsTable.vue';
import { IdentityProviders } from '@/utils/constants';

export default defineComponent({
  name: 'Submissions',

  props: {
    f: {
      type: String,
      required: true,
    },
  },

  components: {
    SubmissionsTable,
  },

  computed: {
    IDP: () => IdentityProviders,
  },
});
</script>
