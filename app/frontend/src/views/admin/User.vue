<template>
  <v-container>
    <h1 class="mt-6" :class="{ 'dir-rtl': isRTL }" :lang="lang">
      {{ $t('trans.admin.user.administerUser') }}
    </h1>
    <AdministerUser :userId="u" />
  </v-container>
</template>

<script>
import { defineComponent } from 'vue';

import AdministerUser from '@/components/admin/AdministerUser.vue';
import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'AdminUserView',

  components: {
    AdministerUser,
  },

  props: {
    u: String,
  },

  computed: {
    ...mapGetters('form', ['isRTL', 'lang']),
  },
});
</script>
