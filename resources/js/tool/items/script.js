import Mixin from '../../_mixin'
import Folders from '../folders'

export default {
  mixins: [Mixin],
  components: { Folders },
  computed: {
    folders() {
      return this.$parent.folders;
    },
    folder() {
      return this.$parent.folder;
    },
    getFolders() {
      let keys = Object.assign({}, this.folders);
      this.folder.slice(1, -1).split('/').forEach(item => {
        if ( '' !== item )
          keys = Object.assign({}, keys[item] || {});
      });
      return Object.keys(keys);
    }
  },
  methods: {
    clickItem(item) {
      if ( this.$parent.bulk.enable ) {
        if ( this.$parent.bulk.ids[item.id] ) {
          this.$delete(this.$parent.bulk.ids, item.id);
        } else {
          this.$set(this.$parent.bulk.ids, item.id, item);
        }
      } else {
        if ( this.$parent.field ) {
          Nova.$emit(`nmlSelectFiles[${this.$parent.field}]`, [item]);
        } else {
          this.$parent.item = item;
          this.$parent.popup = 'info';
        }
      }
    }
  }
}
