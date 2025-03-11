<template>
  <div>
    <MySubmissionsTable :formId="f" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';

import MySubmissionsTable from '~/components/forms/submission/MySubmissionsTable.vue';

export default defineComponent({
  name: 'Submissions',

  props: {
    f: {
      type: String,
      required: true,
    },
  },

  components: {
    MySubmissionsTable,
  },
});
</script>
