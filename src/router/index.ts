import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  {
    path: '/',
    redirect: { name: 'main' },
  },
  {
    path: '/main',
    name: 'main',
    component: async () => await import(/* webpackChunkName: "main" */ '@/pages/main/index.vue'),
  },
  {
    path: '/compTextEditor',
    name: 'compTextEditor',
    component: async () => await import(/* webpackChunkName: "compTextEditor" */ '@/pages/main/components/textEditor/index.vue'),
  },
  {
    path: '/demo',
    name: 'demo',
    redirect: '/demo/size',
    children: [
      {
        path: 'size',
        component: async () => await import(/* webpackChunkName: "size" */ '@/demo/size/index.vue'),
      },
      {
        path: 'scale',
        component: async () => await import(/* webpackChunkName: "scale" */ '@/demo/scale/index.vue'),
      },
      {
        path: 'restore',
        component: async () => await import(/* webpackChunkName: "restore" */ '@/demo/restore/index.vue'),
      },
      {
        path: 'transform',
        component: async () => await import(/* webpackChunkName: "transform" */ '@/demo/transform/index.vue'),
      },
      {
        path: 'event',
        component: async () => await import(/* webpackChunkName: "event" */ '@/demo/event/index.vue'),
      },
      {
        path: 'proxy',
        component: async () => await import(/* webpackChunkName: "proxy" */ '@/demo/proxy/index.vue'),
      },
      {
        path: 'update',
        component: async () => await import(/* webpackChunkName: "update" */ '@/demo/update/index.vue'),
      },
      {
        path: 'automat',
        component: async () => await import(/* webpackChunkName: "automat" */ '@/demo/automat/index.vue'),
      },
      {
        path: 'b-spline-curve',
        component: async () => await import(/* webpackChunkName: "bSplineCurve" */ '@/demo/b-spline-curve/index.vue'),
      },
      {
        path: 'b-spline-curve-1',
        component: async () => await import(/* webpackChunkName: "bSplineCurve" */ '@/demo/b-spline-curve-1/index.vue'),
      },
      {
        path: 'dotted-font',
        component: async () => await import(/* webpackChunkName: "dottedFont" */ '@/demo/dotted-font/index.vue'),
      },
      {
        path: 'close',
        component: async () => await import(/* webpackChunkName: "bSplineCurve" */ '@/demo/close/index.vue'),
      },
      {
        path: 'partRender',
        component: async () => await import(/* webpackChunkName: "partRender" */ '@/demo/partRender/index.vue'),
      },
      {
        path: 'constraintArcLine',
        component: async () => await import(/* webpackChunkName: "partRender" */ '@/demo/constraint-arc-line/index.vue'),
      },
      {
        path: 'constraintArcArc',
        component: async () => await import(/* webpackChunkName: "partRender" */ '@/demo/constraint-arc-arc/index.vue'),
      },
      {
        path: 'cluster',
        component: async () => await import(/* webpackChunkName: "rtreeCluster" */ '@/demo/r-tree/cluster.vue'),
      },
      {
        path: 'uniform',
        component: async () => await import(/* webpackChunkName: "rtreeUniform" */ '@/demo/r-tree/uniform.vue'),
      },
      {
        path: 'richText',
        component: async () => await import(/* webpackChunkName: "rtreeUniform" */ '@/demo/rich-text/index.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
