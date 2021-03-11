import Action from "./action";
import Search from "./search";
import Items from "./items";
import Loader from "./loader";
import Popup from "./popup";
import Crop from "./crop";
import _ from "lodash";

let timeout = null;
let wheel = null;

export default {
  props: {
    field: { type: String, default: null },
    isArray: { default: false },
    types: { type: Array, default: [] },
    prefix: { type: String, default: null },
    folder: { type: String, default: "/" },
    ratio: { type: Number, default: null },
  },

  components: {
    Action,
    Search,
    Items,
    Loader,
    Crop,
    Popup,
  },

  data() {
    let config = window.Nova.config.novaMediaLibrary;
    config.display =
      "list" === localStorage.getItem("nml-display") ? "list" : "gallery";
    return {
      config,

      bulk: {
        ids: {},
        enable: false,
      },

      items: {
        array: [],
        total: null,
      },

      filter: {
        title: null,
        type: this.types,
        from: null,
        to: null,
        page: 0,
      },
      oldFilter: {},

      loading: false,
      item: null,
      popup: null,
    };
  },
  computed: {
    realPrefix() {
      return this.prefix ? this.prefix : this.config.prefix;
    },
    folders() {
      if (this.realPrefix) {
        return _.get(this.config.folders, this.realPrefix.split("/"));
      }

      return this.config.folders;
    },
    folderFilter() {
      return "folders" === this.config.store
        ? this.fullPath(this.folder)
        : null;
    },
  },
  methods: {
    checkRatio(width, height) {
      if (!this.ratio) return true;
      const ratio = width / height;
      if (ratio === this.ratio) return true;
      else if (ratio > this.ratio) return width / (height + 1) < this.ratio;
      else return height > 1 && width / (height - 1) > this.ratio;
    },
    selectItem(item, force = false) {
      if (this.bulk.enable) {
        if (this.bulk.ids[item.id]) {
          this.$delete(this.bulk.ids, item.id);
        } else {
          this.$set(this.bulk.ids, item.id, item);
        }
      } else {
        if (this.field) {
          if (
            !force &&
            !this.checkRatio(item.options.wh[0], item.options.wh[1])
          ) {
            this.item = item;
            this.popup = "ratio";
          } else Nova.$emit(`nmlSelectFiles[${this.field}]`, [item]);
        } else {
          this.item = item;
          this.popup = "info";
        }
      }
    },
    fullPath(path) {
      return (this.realPrefix ? "/" + this.realPrefix : "") + path;
    },
    bulkLen() {
      return Object.keys(this.bulk.ids).length;
    },
    clearData() {
      this.items = { array: [], total: null };
      this.filter.page = 0;
    },
    get() {
      this.loading = true;
      Nova.request()
        .post("/nova-vendor/nova-media-library/get", {
          title: this.filter.title,
          type: this.filter.type,
          from: this.filter.from,
          to: this.filter.to,
          page: this.filter.page,
          folder: this.folderFilter,
        })
        .then((r) => {
          this.loading = false;
          this.items = {
            array: this.items.array.concat(r.data.array),
            total: r.data.total,
          };
        })
        .catch((e) => {
          this.loading = false;
          window.nmlToastHook(e);
        });
    },
    deleteFiles(ids) {
      if (!ids.length || !confirm(this.__("Delete selected files?"))) return;
      this.loading = true;
      Nova.request()
        .post("/nova-vendor/nova-media-library/delete", { ids: ids })
        .then((r) => {
          this.popup = null;
          this.$set(this.bulk, "ids", {});
          this.clearData();
          this.get();
          this.loading = false;
        })
        .catch((e) => {
          this.loading = false;
          window.nmlToastHook(e);
        });
    },
    doSearch() {
      if (JSON.stringify(this.filter) === JSON.stringify(this.oldFilter))
        return;
      this.oldFilter = { ...this.filter };
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.clearData();
        this.get();
      }, 1000);
    },
    loader() {
      this.filter.page++;
      this.oldFilter.page++;
      this.get();
    },
    scroller() {
      if (this.loading || this.items.array.length === this.items.total)
        return false;
      try {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight)
          this.loader();
      } catch (e) {}
    },
  },
  created() {
    if ("onwheel" in document) wheel = "wheel";
    if ("onmousewheel" in document) wheel = "mousewheel";
    this.oldFilter = { ...this.filter };
    this.get();

    if (!this.field && wheel) document.addEventListener(wheel, this.scroller);
  },

  beforeDestroy() {
    if (!this.field && wheel)
      document.removeEventListener(wheel, this.scroller);
  },
};
