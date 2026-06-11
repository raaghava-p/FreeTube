import { createRouter, createWebHashHistory } from 'vue-router'
// Keep Subscriptions as static import — it's the default/home route and must load instantly
import Subscriptions from '../views/Subscriptions/Subscriptions.vue'

// Lazy-loaded routes — Webpack will code-split each into a separate chunk
const SubscribedChannels = () => import(/* webpackChunkName: "subscribed-channels" */ '../views/SubscribedChannels/SubscribedChannels.vue')
const ProfileSettings = () => import(/* webpackChunkName: "profile-settings" */ '../views/ProfileSettings/ProfileSettings.vue')
const Trending = () => import(/* webpackChunkName: "trending" */ '../views/Trending/Trending.vue')
const Popular = () => import(/* webpackChunkName: "popular" */ '../views/Popular/Popular.vue')
const UserPlaylists = () => import(/* webpackChunkName: "user-playlists" */ '../views/UserPlaylists/UserPlaylists.vue')
const History = () => import(/* webpackChunkName: "history" */ '../views/History/History.vue')
const Settings = () => import(/* webpackChunkName: "settings" */ /* webpackPrefetch: true */ '../views/Settings/Settings.vue')
const About = () => import(/* webpackChunkName: "about" */ '../views/About/About.vue')
const SearchPage = () => import(/* webpackChunkName: "search" */ '../views/SearchPage/SearchPage.vue')
const Playlist = () => import(/* webpackChunkName: "playlist" */ '../views/Playlist/Playlist.vue')
const Channel = () => import(/* webpackChunkName: "channel" */ /* webpackPrefetch: true */ '../views/Channel/Channel.vue')
const Watch = () => import(/* webpackChunkName: "watch" */ /* webpackPrefetch: true */ '../views/Watch/Watch.vue')
const Hashtag = () => import(/* webpackChunkName: "hashtag" */ '../views/Hashtag/Hashtag.vue')
const Post = () => import(/* webpackChunkName: "post" */ '../views/Post.vue')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'default',
      meta: {
        title: 'Subscriptions'
      },
      component: Subscriptions
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      meta: {
        title: 'Subscriptions'
      },
      component: Subscriptions
    },
    {
      path: '/subscribedchannels',
      name: 'subscribedChannels',
      meta: {
        title: 'Channels'
      },
      component: SubscribedChannels
    },
    ...(process.env.SUPPORTS_LOCAL_API
      ? [{
          path: '/trending',
          name: 'trending',
          meta: {
            title: 'Trending'
          },
          component: Trending
        }]
      : []),
    {
      path: '/popular',
      name: 'popular',
      meta: {
        title: 'Most Popular'
      },
      component: Popular
    },
    {
      path: '/userplaylists',
      name: 'userPlaylists',
      meta: {
        title: 'Your Playlists'
      },
      component: UserPlaylists
    },
    {
      path: '/history',
      name: 'history',
      meta: {
        title: 'History'
      },
      component: History
    },
    {
      path: '/settings',
      name: 'settings',
      meta: {
        title: 'Settings'
      },
      component: Settings
    },
    {
      path: '/about',
      name: 'about',
      meta: {
        title: 'About'
      },
      component: About
    },
    {
      path: '/settings/profile',
      name: 'profileSettings',
      meta: {
        title: 'Profile Settings'
      },
      component: ProfileSettings
    },
    {
      path: '/search/:query',
      meta: {
        title: 'Search Results'
      },
      component: SearchPage
    },
    {
      path: '/playlist/:id',
      meta: {
        title: 'Playlist'
      },
      component: Playlist
    },
    {
      path: '/channel/:id/:currentTab?',
      meta: {
        title: 'Channel'
      },
      component: Channel
    },
    {
      path: '/watch/:id',
      meta: {
        title: 'Watch'
      },
      component: Watch
    },
    {
      path: '/hashtag/:hashtag',
      meta: {
        title: 'Hashtag'
      },
      component: Hashtag
    },
    {
      path: '/post/:id',
      meta: {
        title: 'Post',
      },
      component: Post
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (savedPosition !== null) {
          resolve(savedPosition)
        } else {
          resolve({ left: 0, top: 0 })
        }
      }, 500)
    })
  }
})

export default router
