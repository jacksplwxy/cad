<template>
    <div>
      proxy测试
    </div>
</template>
<script setup lang="ts">
const person = {}

const proxy = new Proxy(person, {
  set (target, key, value) {
    console.log(1111, target, key, value)
    return Reflect.set(target, key, value)
  },
  get (target, key) {
    // console.log(22222, target, key)
    return Reflect.get(target, key)
  }
})

person.age = 19
person.sex = '女'
person.name = '李四'
person.sadjkf23 = {
  type: 'circle',
  r: 10
}
// person.age = 20
// person.sex = '男女'
// person.name = '王五'
console.log(333333, proxy)
console.log(4444444, person)
Reflect.set(person, 'name', 'jacksplwxy')
</script>
