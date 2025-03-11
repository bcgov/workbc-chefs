<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <ExportSubmissions :formId="f" />
  </BaseSecure>
</template>

<script>
import { defineComponent } from 'vue';

import ExportSubmissions from '@/components/forms/ExportSubmissions.vue';
import { IdentityProviders } from '@/utils/constants';
export default defineComponent({
  name: 'Export',

  components: {
    ExportSubmissions,
  },

  props: {
    f: {
      type: String,
      required: true,
    },
  },

  computed: {
    IDP: () => IdentityProviders,
  },
});
</script>
