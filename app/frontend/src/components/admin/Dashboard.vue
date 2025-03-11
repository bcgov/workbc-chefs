<template>
  <v-container>
    <iframe :src="url" width="100%" height="600px"></iframe>
  </v-container>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Dashboard',

  props: {
    url: {
      type: String,
    },
  },
});
</script>
