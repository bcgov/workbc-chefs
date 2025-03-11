<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <TeamManagement :formId="f" />
  </BaseSecure>
</template>

<script>
import { defineComponent } from 'vue';

import TeamManagement from '@/components/forms/manage/TeamManagement.vue';
import { IdentityProviders } from '@/utils/constants';

export default defineComponent({
  name: 'FormTeams',

  components: {
    TeamManagement,
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
