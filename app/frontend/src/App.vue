<template>
  <v-app>
    <BaseNotificationContainer />
    <BCGovHeader />
    <BCGovNavBar />

    <v-main>
      <transition name="component-fade" mode="out-in">
        <router-view />
      </transition>
    </v-main>

    <BCGovFooter />
  </v-app>
</template>

<script>
import { defineComponent } from 'vue';

import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import BCGovFooter from '~/components/bcgov/BCGovFooter.vue';
import BCGovNavBar from '~/components/bcgov/BCGovNavBar.vue';

export default defineComponent({
  name: 'App',

  components: {
    BCGovHeader,
    BCGovFooter,
    BCGovNavBar,
  },
});
</script>
