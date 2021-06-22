import axios from "axios";
import router from "../router";
import { state } from "./state";
//axios.defaults.headers.common['Authorization'] = "Bearer 41|cZiiK8k3WHhxAdSAXO8JlW5ebbn6of143T17FiNK";

const actions = {
  moveToDestination({ commit }) {
    router.push(state.destinationURL);
    commit("setStateProps", { name: "destinationURL", value: null });
  },
  login({ commit }, data) {
    commit("setUser", data);
  },
  checkLogin({ commit }) {
    commit("checkLogin");
  },
  logout({ commit }) {
    commit("logoutUser");
  },
  setProps({ commit }, data) {
    commit("setStateProps", data);
  },
  messages({ commit }, payload) {
    commit("setStateProps", { name: "messageLoading", value: true });
    let initialMessagesCount = state.user.messages.length;
    axios
      .post(process.env.VUE_APP_APIURL + "/messages", payload)
      .then((response) => {
        let data = response.data;
        /* console.log(data.ad_chats);
        console.log(data.messages); */
        //console.log("data.user_id: " + payload.user_id);
        commit("setStateProps", { name: "messageLoading", value: false });
        commit("setStateProps", {
          name: "messages",
          value: data.messages,
          type: "user",
        });
        commit("setStateProps", {
          name: "ad_chats",
          value: data.ad_chats,
          type: "user",
        });
        if (payload.user_id == undefined) {
          commit("setStateProps", { name: "messageSuccess", value: true });
          setTimeout(() => {
            commit("setStateProps", { name: "messageSuccess", value: false });
          }, 3500);
        }
        if (state.user.messages.length != initialMessagesCount) {
          let lastMessage = state.user.messages[state.user.messages.length - 1];
          if (state.user.id == lastMessage.receiver_id) alert("New message");
        }
        //alert("Message successfully sent to seller");
      })
      .catch(() => {
        console.log("An error occurred on the server. Please try again.");
        //console.log(error);
      });
  },
  favorites({ commit }, payload) {
    if (payload.type == "delete") {
      let userFavs = state.user.favorites.filter((item) => {
        return item.id != payload.adID;
      });
      commit("setStateProps", {
        name: "favorites",
        value: userFavs,
        type: "user",
      });
    }
  },
  fetchData({ commit }) {
    //get ads from the server
    commit("setStateProps", { name: "adsIsLoading", value: true });
    let urlPostfix = "";
    let urlPara = "";
    let totalAdsCount = null;
    if (state.category) {
      urlPostfix += `/${state.category}`;
      urlPostfix += state.subcategory ? `/${state.subcategory}` : "";
    }
    if (state.state) {
      urlPara += `?state=${state.state}`;
      urlPara += state.lga ? `&lga=${state.lga}` : "";
    }
    //alert(process.env.VUE_APP_APIURL+"/ads"+urlPostfix+urlPara);
    axios
      .get(process.env.VUE_APP_APIURL + "/ads" + urlPostfix + urlPara)
      .then(function(response) {
        //console.log(response.data);
        commit("setStateProps", { name: "ads", value: response.data.ads });
        commit("setStateProps", { name: "adsIsLoading", value: false });
        totalAdsCount = response.data.total_ads_count;
        if (localStorage.getItem("lastTotalAdsCount") === null) {
          //alert("No lastCount in storage");
          localStorage.setItem("lastTotalAdsCount", totalAdsCount);
        } else {
          //alert(localStorage.getItem('lastTotalAdsCount'));
        }
        //clear front end cache based on back end variable
        if (response.data.clear_category_cache == 1) {
          //alert("clearing categories");
          localStorage.removeItem("categories");
        }
        console.log("user-cache: " + response.data.clear_user_cache);
        if (response.data.clear_user_cache == 1) {
          //alert("clearing user data");
          localStorage.removeItem("userData");
        }
        setState("states");
        setState("categories");
      });
    //if stored ads counts has changed, re-fetch states to reflect current ads distributions
    function setState(data) {
      if (
        state[data] == null ||
        totalAdsCount != localStorage.getItem("lastTotalAdsCount")
      ) {
        //console.log(`${data} at the moment is null or doesn't match`);
        let localData = localStorage.getItem(data);
        if (
          localData &&
          JSON.parse(localData) &&
          totalAdsCount == localStorage.getItem("lastTotalAdsCount")
        ) {
          //console.log(`getting ${data} form local storage`);
          localData = JSON.parse(data);
          commit("setStateProps", { name: data, value: localData });
        } else {
          //console.log(`getting ${data} form server`);
          axios
            .get(process.env.VUE_APP_APIURL + "/ads/get_" + data)
            .then(function(response) {
              commit("setStateProps", {
                name: data,
                value: response.data[data],
              });
              localStorage.setItem(data, JSON.stringify(response.data[data]));
              localStorage.setItem("lastTotalAdsCount", totalAdsCount);
            });
        }
      }
    }
  },
};
export { actions };
