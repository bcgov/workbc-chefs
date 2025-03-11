<template>
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="mx-1"
          data-cy="shareFormButton"
          color="primary"
          @click="dialog = true"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon class="mr-1">share</v-icon>
        </v-btn>
      </template>
      <span :lang="lang">{{ $t('trans.shareForm.shareForm') }}</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900">
      <v-card>
        <v-card-title
          :class="{ 'dir-rtl': isRTL }"
          class="text-h5 pb-0"
          :lang="lang"
          >{{ $t('trans.shareForm.shareLink') }}</v-card-title
        >
        <v-card-text>
          <hr />
          <p class="mb-5" :class="{ 'dir-rtl': isRTL }" :lang="lang">
            {{ $t('trans.shareForm.copyQRCode') }}
          </p>
          <v-alert
            :modelValue="warning"
            :class="[NOTIFICATIONS_TYPES.WARNING.class, { 'dir-rtl': isRTL }]"
            :icon="NOTIFICATIONS_TYPES.WARNING.icon"
            transition="scale-transition"
            :lang="lang"
          >
            {{ $t('trans.shareForm.warningMessage') }}
          </v-alert>
          <v-text-field
            readonly
            dense
            flat
            outlined
            label="URL"
            data-test="text-shareUrl"
            :modelValue="formLink"
            :class="{ 'dir-rtl': isRTL }"
          >
            <template #prepend>
              <v-icon>link</v-icon>
            </template>
            <template #append-outer>
              <BaseCopyToClipboard
                class="mt-n1"
                :copyText="formLink"
                :tooltipText="$t('trans.shareForm.copyURLToClipboard')"
                :lang="lang"
              />
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    class="mt-n1"
                    :class="{ 'dir-rtl': isRTL }"
                    color="primary"
                    :href="formLink"
                    icon
                    target="_blank"
                    v-bind="attrs"
                    data-cy="shareFormLinkButton"
                    v-on="on"
                  >
                    <v-icon class="mr-1">open_in_new</v-icon>
                  </v-btn>
                </template>
                <span :class="{ 'dir-rtl': isRTL }" :lang="lang">{{
                  $t('trans.shareForm.openThisForm')
                }}</span>
              </v-tooltip>
            </template>
          </v-text-field>

          <v-row no-gutters align="end" justify="center">
            <v-col cols="auto">
              <div class="qrCodeContainer">
                <qrcode-vue
                  :modelValue="formLink"
                  :size="qrSize"
                  renderAs="canvas"
                  :level="qrLevel"
                />
              </div>
            </v-col>
            <v-col cols="1" class="text-center">
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    icon
                    @click="downloadQr"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon>get_app</v-icon>
                  </v-btn>
                </template>
                <span :lang="lang">{{
                  $t('trans.shareForm.downloadQRCode')
                }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn
            :class="{ 'dir-rtl': isRTL }"
            class="mb-5 close-dlg"
            color="primary"
            @click="dialog = false"
          >
            <span :lang="lang">{{ $t('trans.shareForm.close') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import { defineComponent } from 'vue';

import QrcodeVue from 'qrcode.vue';
import { NotificationTypes } from '~/utils/constants';
import { mapGetters } from 'vuex';
export default defineComponent({
  components: {
    QrcodeVue,
  },

  props: {
    formId: {
      type: String,
      required: true,
    },
    warning: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      dialog: false,
      qrLevel: 'M',
      qrSize: 900,
    };
  },

  computed: {
    ...mapGetters('form', ['lang']),

    formLink() {
      // TODO: Consider using vue-router to generate this url string instead
      return `${window.location.origin}${process.env.BASE_URL}form/submit?f=${this.formId}`;
    },
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
    },
    ...mapGetters('form', ['isRTL']),
  },

  methods: {
    downloadQr() {
      let link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = document.querySelector('.qrCodeContainer canvas').toDataURL();
      link.click();
    },
  },
});
</script>

<style scoped lang="scss">
@import '~vuetify/lib/styles/settings/_variables.scss';

.qrCodeContainer {
  @media #{map-get($display-breakpoints, 'sm-and-up')} {
    padding-left: 75px;
  }

  :deep(canvas) {
    margin-top: 50px;
    max-width: 250px;
    max-height: 250px;
  }
}
.close-dlg {
  margin-top: 50px;
}
</style>
