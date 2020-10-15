/**
 * From: https://gist.github.com/loilo/4d385d64e2b8552dcc12a0f5126b6df8
 * @param clazz
 */
import {RedBeanNode} from "./redbean-node";

export function magicMethods (clazz) {
  // A toggle switch for the __isset method
  // Needed to control "prop in instance" inside of getters
  let issetEnabled = true

  const classHandler = Object.create(null)

  // Trap for class instantiation
  classHandler.construct = (target, args, receiver) => {
    // Wrapped class instance
    const instance = Reflect.construct(target, args, receiver)

    // Instance traps
    const instanceHandler = Object.create(null)

    // __get()
    // Catches "instance.property"
    const get = Object.getOwnPropertyDescriptor(clazz.prototype, '__get')
    if (get) {

      instanceHandler.get = (target, name, receiver) => {
        // We need to turn off the __isset() trap for the moment to establish compatibility with PHP behaviour
        // PHP's __get() method doesn't care about its own __isset() method, so neither should we
        issetEnabled = false
        const exists = Reflect.has(target, name)
        issetEnabled = true

        if (exists) {
          return Reflect.get(target, name, receiver)
        } else {

            // No idea why Bean is being called then(), just skip this
            if (name == "then" && args[1] instanceof RedBeanNode) {
                return undefined;
            }

          return get.value.call(target, name)
        }
      }
    }

    // __set()
    // Catches "instance.property = ..."
    const set = Object.getOwnPropertyDescriptor(clazz.prototype, '__set')
    if (set) {
      instanceHandler.set = (target, name, value, receiver) => {
        if (name in target) {
          Reflect.set(target, name, value, receiver)
        } else {
          target.__set.call(target, name, value, receiver)
            return true;
        }
      }
    }

    // __isset()
    // Catches "'property' in instance"
    const isset = Object.getOwnPropertyDescriptor(clazz.prototype, '__isset')
    if (isset) {
      instanceHandler.has = (target, name) => {
        if (!issetEnabled) return Reflect.has(target, name)

        return isset.value.call(target, name)
      }
    }

    // __unset()
    // Catches "delete instance.property"
    const unset = Object.getOwnPropertyDescriptor(clazz.prototype, '__unset')
    if (unset) {
      instanceHandler.deleteProperty = (target, name) => {
        return unset.value.call(target, name)
      }
    }

    return new Proxy(instance, instanceHandler)
  }

  // __getStatic()
  // Catches "class.property"
  if (Object.getOwnPropertyDescriptor(clazz, '__getStatic')) {
    classHandler.get = (target, name, receiver) => {
      if (name in target) {
        return target[name]
      } else {
        return target.__getStatic.call(receiver, name)
      }
    }
  }

  // __setStatic()
  // Catches "class.property = ..."
  if (Object.getOwnPropertyDescriptor(clazz, '__setStatic')) {
    classHandler.set = (target, name, value, receiver) => {
      if (name in target) {
        return target[name]
      } else {
        return target.__setStatic.call(receiver, name, value)
      }
    }
  }

  return new Proxy(clazz, classHandler)
}
