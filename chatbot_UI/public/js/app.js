'use strict';
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
const Vue = require('vue');
//=============================================================================
/**
 * config
 */
//=============================================================================
Vue.use(require('vue-resource'));
Vue.http.options.root = '/root';
//=============================================================================
const VM = new Vue({
  el: '#app',
  data: {
    output: '',
    userInput: '',
    welcomeURL: '/welcome',
    loadingSpinner: true
  },
  beforeMount: function () {
    console.log('before mount fired...');
    const URL = this.welcomeURL;
    this.$http.get(URL)
      .then(data => {
        this.loadingSpinner = false;
        console.log('response from backend...');
        console.log(data);
        return this.output = data.body.data;
      })
      .catch(info => {
        this.loadingSpinner = false;
        console.log('yawa gas...');
        return console.log(info);
      });
  }
});
//=============================================================================
