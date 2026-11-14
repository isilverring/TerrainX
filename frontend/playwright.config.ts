import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'./tests',fullyParallel:false,workers:1,timeout:60000,retries:0,
 use:{baseURL:'http://127.0.0.1:5173',channel:'chrome',headless:true,viewport:{width:1568,height:1003},screenshot:'only-on-failure',launchOptions:{args:['--enable-unsafe-swiftshader','--disable-dev-shm-usage']}},
 reporter:[['list']],outputDir:'../artifacts/qa/test-results'
})
