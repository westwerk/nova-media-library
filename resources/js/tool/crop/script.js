import Cropper from "cropperjs";

export default {
  props: {
    forced: { type: Boolean, default: false },
    ratio: { type: Number, default: null },
  },

  data() {
    return {
      img: null,
      crop: null,
      info: { rotate: 0 },
    };
  },
  methods: {
    closePopup() {
      this.$parent.popup = this.forced ? null : "info";
    },
    rotate() {
      this.crop.rotateTo(parseInt(this.info.rotate || 0));
    },
    save(over) {
      this.info.over = over;
      this.info.id = this.$parent.item.id;
      this.$parent.loading = true;
      Nova.request()
        .post("/nova-vendor/nova-media-library/crop", this.info)
        .then((response) => {
          if (this.forced) {
            this.$parent.item = null;
            this.$parent.selectItem(response.data);
          } else {
            this.$toasted.show(this.__("Image cropped successfully"), {
              type: "success",
            });
            this.$parent.clearData();
            this.$parent.get();
            this.$parent.item = null;
          }
        })
        .catch((e) => {
          this.$parent.loading = false;
          window.nmlToastHook(e);
        });
    },
  },
  mounted() {
    document.body.classList.add("overflow-hidden");
    let el = this;
    el.img = document.getElementById("cropper-img");
    el.crop = new Cropper(el.img, {
      autoCrop: false,
      aspectRatio: el.ratio,
      checkCrossOrigin: false,
      guides: false,
      //toggleDragModeOnDblclick: false,
      viewMode: 1,
      //zoomable: false,
      crop(e) {
        el.info = {
          x: e.detail.x,
          y: e.detail.y,
          width: parseInt(e.detail.width),
          height: parseInt(e.detail.height),
          rotate: e.detail.rotate,
        };
      },
    });
  },
  beforeDestroy() {
    document.body.classList.remove("overflow-hidden");
  },
};
