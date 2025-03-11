<template>
  <div>
    <FormsTable />
  </div>
</template>

<script>
import { defineComponent } from 'vue';

import FormsTable from '~/components/designer/FormsTable.vue';

export default defineComponent({
  name: 'UserForms',

  components: {
    FormsTable,
  },
});
</script>
