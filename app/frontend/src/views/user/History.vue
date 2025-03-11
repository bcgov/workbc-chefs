<template>
  <BaseSecure>
    <h1 class="my-6 text-center" :lang="lang">
      {{ $t('trans.history.submissnHistory') }}
    </h1>
  </BaseSecure>
</template>

<script>
import { defineComponent } from 'vue';

import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'UserHistory',

  computed: {
    ...mapGetters('form', ['lang']),
  },
});
</script>
