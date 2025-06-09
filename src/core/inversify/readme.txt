* 指南：
  · Support for Classes
    ~ Inversify允许你直接使用类进行依赖注入。
    ~ 例子：
      import { Container, injectable, inject } from "inversify";
      @injectable()
      class Warrior {
          fight() { return "The warrior fights!" }
      }
      const container = new Container();
      // 将Warrior接口绑定到Warrior类。也就是说，当需要Warrior接口时，容器会实例化Warrior类。
      // 第一个.bind(Warrior)是标识符（identifier），用于在容器中唯一标识这个绑定，可以是字符串、符号或其他类型的唯一值。
      // 第二个参数.to(Warrior)表示将接口绑定到具体的实现类。
      container.bind<Warrior>(Warrior).to(Warrior); 等价于 container.bind<Warrior>(Warrior).toSelf();
      const warrior = container.get<Warrior>(Warrior);
      console.log(warrior.fight());
  · Support for Symbols
    ~ Inversify支持使用Symbol作为标识符。
    ~ 例子：
      const TYPES = {
          Warrior: Symbol.for("Warrior")
      };
      container.bind<Warrior>(TYPES.Warrior).to(Warrior);
      const warrior = container.get<Warrior>(TYPES.Warrior);
      console.log(warrior.fight());
  · Container API
    ~ Inversify提供了强大的容器API来管理依赖关系。
    ~ 例子：
      const container = new Container();
      container.bind<Warrior>(Warrior).to(Warrior);
  · Declaring Container Modules
    ~ 可以通过模块来组织容器绑定。
    ~ 例子：
      const myModule = (container: Container) => {
          container.bind<Warrior>(Warrior).to(Warrior);
      };
      myModule(container);
      const warrior = container.get<Warrior>(Warrior);
      console.log(warrior.fight());
  · Container Snapshots
    ~ 容器快照用于创建依赖的快照状态。
    ~ 例子：
      const snapshot = container.createChild();
      snapshot.bind<Warrior>(Warrior).to(Warrior);
  · Controlling the Scope of the Dependencies
    ~ 可以控制依赖的生命周期。
    ~ 例子：
      @injectable()
      class SingletonService { }
      // inSingletonScope表示单例
      container.bind<SingletonService>(SingletonService).to(SingletonService).inSingletonScope();
      // inSingletonScope表示瞬态
      container.bind<Weapon>('Weapon').to(Katana) 等价于 container.bind<Weapon>('Weapon').to(Katana).inTransientScope();
  · Declaring Optional Dependencies
    ~ 可以声明可选依赖。
    ~ 例子：
      @injectable()
      class Warrior {
          constructor(@optional() @inject("Weapon") private weapon?: Weapon) { }
      }
  · Injecting a Constant or Dynamic Value
    ~ 可以注入常量或动态值。
    ~ 例子：
      container.bind<string>("Config").toConstantValue("some config");
      const config = container.get<string>("Config");
      console.log(config);
  · Injecting a Class Constructor
    ~ 可以注入类构造函数。
    ~ 例子：
      container.bind<() => Warrior>("WarriorFactory").toConstructor(Warrior);
      const warriorFactory = container.get<() => Warrior>("WarriorFactory");
      const warrior = warriorFactory();
      console.log(warrior.fight());
  · Injecting a Factory
    ~ 可以注入工厂方法。
    ~ 例子：
      container.bind<() => Warrior>("WarriorFactory").toFactory<Warrior>(context => () => {
          return new Warrior();
      });
      const warriorFactory = container.get<() => Warrior>("WarriorFactory");
      const warrior = warriorFactory();
      console.log(warrior.fight());
  · Auto Factory
    ~ Inversify支持自动工厂。
    ~ 例子：
      container.bind<Warrior>(Warrior).to(Warrior);
      container.bind<() => Warrior>("WarriorFactory").toAutoFactory(Warrior);
      const warriorFactory = container.get<() => Warrior>("WarriorFactory");
      const warrior = warriorFactory();
      console.log(warrior.fight());
  · Injecting a Provider (Asynchronous Factory)
    ~ 可以注入异步工厂。
    ~ 例子：
      container.bind<() => Promise<Warrior>>("WarriorProvider").toProvider(async context => {
          return new Warrior();
      });
      const warriorProvider = container.get<() => Promise<Warrior>>("WarriorProvider");
      warriorProvider().then(warrior => console.log(warrior.fight()));
  · Activation Handler
    ~ 可以使用激活处理程序在依赖激活时执行逻辑。
    ~ 例子：
      @injectable()
      class Warrior {
          constructor() {
              console.log("Warrior activated");
          }
      }
      container.bind<Warrior>(Warrior).to(Warrior).onActivation((context, warrior) => {
          console.log("Activation logic");
          return warrior;
      });
      const warrior = container.get<Warrior>(Warrior);
  · Middleware
    ~ 支持中间件功能来增强依赖处理。
    ~ 例子：
      container.applyMiddleware((next) => {
          return async (args) => {
              console.log("Middleware in action");
              return next(args);
          };
      });
      container.applyMiddleware((next) => {
          return async (args) => {
              console.log("Before");
              const result = await next(args);
              console.log("After");
              return result;
          };
      });
  · Multi-injection
    ~ 支持多重注入
    ~ 例子：
      @injectable()
      class Warrior { }
      @injectable()
      class Archer { }
      container.bind<Warrior>("Fighters").to(Warrior);
      container.bind<Archer>("Fighters").to(Archer);
      const fighters = container.getAll<Warrior | Archer>("Fighters");
      console.log(fighters.length); // 2


* container：
  · bind(): 绑定依赖
    ~ bind方法用于将接口（或标识符）与其具体实现类绑定。
    ~ 例子：
      import { Container, injectable } from "inversify";
      // 定义接口和实现
      interface Weapon {
          hit(): string;
      }
      @injectable()
      class Katana implements Weapon {
          hit() {
              return "cut!";
          }
      }
      @injectable()
      class Shuriken implements Weapon {
          hit() {
              return "throw!";
          }
      }
      let container = new Container();
      // 将接口 Weapon 绑定到 Katana 实现
      container.bind<Weapon>("Weapon").to(Katana);
      let weapon = container.get<Weapon>("Weapon");
      console.log(weapon.hit()); // 输出 "cut!"
  · unbind(): 解除绑定
    ~ unbind用于从容器中移除某个标识符的绑定。
    ~ 例子：
      container.unbind("Weapon"); // 移除 "Weapon" 标识符的绑定
  · rebind(): 重新绑定依赖
    ~ rebind与unbind+bind类似，可以用来重新绑定依赖，而不需要先手动解除绑定。
    ~ 例子：
      container.rebind<Weapon>("Weapon").to(Shuriken);
      let newWeapon = container.get<Weapon>("Weapon");
      console.log(newWeapon.hit()); // 输出 "throw!"
  · get(): 获取绑定的依赖
    ~ get方法用于从容器中获取依赖对象，类似于依赖的“实例化”。
    ~ 如果bind时没有inSingletonScope()其注册为“单例”，则每次get就相当于new一个新实例
    ~ 例子：
      let weapon = container.get<Weapon>("Weapon");
  · getAll(): 获取所有符合条件的绑定
    ~ 当同一个标识符绑定了多个实现时，getAll可以获取该标识符的所有实现。
    ~ 例子：
      container.bind<Weapon>("Weapon").to(Katana);
      container.bind<Weapon>("Weapon").to(Shuriken);
      let weapons = container.getAll<Weapon>("Weapon");
      weapons.forEach(weapon => console.log(weapon.hit())); 
      // 输出 "cut!" 和 "throw!"
  · isBound(): 检查是否已绑定
    ~ isBound用来检查某个标识符是否已经绑定到容器中。
    ~ 例子：
      if (container.isBound("Weapon")) {
          console.log("Weapon is bound.");
      }
  · unbindAll(): 解除所有绑定
    ~ unbindAll会解除与某个标识符相关的所有绑定。
    ~ 例子：
      container.unbindAll("Weapon");
  · resolve(): 手动解析依赖关系
    ~ resolve方法允许你手动解析对象的依赖关系，而不依赖容器中的绑定。
    ~ 例子：
      let weaponInstance = container.resolve(Katana);
      console.log(weaponInstance.hit()); // 输出 "cut!"
  · inSingletonScope(): 单例作用域
    ~ 将依赖绑定为单例模式，意味着容器在其生命周期中只会创建该类的一个实例。
    ~ 例子：
      container.bind<Weapon>("Weapon").to(Katana).inSingletonScope();
      let weapon1 = container.get<Weapon>("Weapon");
      let weapon2 = container.get<Weapon>("Weapon");
      console.log(weapon1 === weapon2); // 输出 true
  · inTransientScope(): 瞬态作用域
    ~ 瞬态模式意味着每次请求都会返回一个新的实例。
    ~ 例子：
      container.bind<Weapon>("Weapon").to(Katana).inTransientScope();
      let weapon1 = container.get<Weapon>("Weapon");
      let weapon2 = container.get<Weapon>("Weapon");
      console.log(weapon1 === weapon2); // 输出 false
  · when(): 条件绑定
    ~ when允许你根据特定条件绑定不同的依赖实现。
    ~ 例子：
      container.bind<Weapon>("Weapon").to(Katana).whenTargetNamed("samurai");
      container.bind<Weapon>("Weapon").to(Shuriken).whenTargetNamed("ninja");
      let samuraiWeapon = container.getNamed<Weapon>("Weapon", "samurai");
      let ninjaWeapon = container.getNamed<Weapon>("Weapon", "ninja");
      console.log(samuraiWeapon.hit()); // 输出 "cut!"
      console.log(ninjaWeapon.hit());   // 输出 "throw!"
  · whenInjectedInto(): 根据父级类型绑定
    ~ whenInjectedInto方法可以根据注入目标的父级类型来决定使用的依赖实现。
    ~ 例子：
      container.bind<Weapon>("Weapon").to(Katana).whenInjectedInto(Samurai);
      container.bind<Weapon>("Weapon").to(Shuriken).whenInjectedInto(Ninja);
  · whenTargetNamed(): 按名称绑定
    ~ 使用whenTargetNamed可以实现条件绑定，通常用来解决不同上下文环境中的依赖。
    ~ 例子：
      container.bind<Weapon>("Weapon").to(Katana).whenTargetNamed("samurai");
  · snapshot(): 快照
    ~ snapshot方法用于创建容器的快照，以便可以在后续调用restore方法时还原到特定状态。
    ~ 例子：
      container.snapshot();
      // 做一些操作...
      container.restore(); // 恢复到快照时的状态
  · restore(): 恢复快照
    ~ restore方法用于将容器恢复到上一次创建快照的状态。
    ~ 例子：
      container.restore(); // 恢复到快照状态
  · load(): 加载模块
    ~ load方法用于加载Inversify模块，可以将绑定逻辑封装成模块化的方式，便于管理。
    ~ 例子：
      import { ContainerModule } from "inversify";
      let myModule = new ContainerModule((bind) => {
          bind<Weapon>("Weapon").to(Katana);
      });
      container.load(myModule);
  · unload(): 卸载模块
    ~ unload方法用于从容器中卸载指定模块。
    ~ 例子：
      container.unload(myModule); // 卸载模块
  · onActivation(): 激活处理器
    ~ onActivation允许你在对象被实例化时执行一些额外的操作。
    ~ 例子：
      container.bind<Weapon>("Weapon").to(Katana).onActivation((context, weapon) => {
          console.log("Weapon activated.");
          return weapon;
      });
  · applyMiddleware(): 中间件
    ~ applyMiddleware允许你为容器绑定添加中间件来拦截和处理依赖的解析过程。
    ~ 例子：
      container.applyMiddleware((planAndResolve) => {
          return (args) => {
              console.log("Resolving dependency:", args.serviceIdentifier);
              return planAndResolve(args);
          };
      });
  · rebind(): 重新绑定依赖
    ~ 和unbind+bind相似，rebind允许你重新绑定一个已经存在的依赖，而不需要先手动解绑。
    ~ 例子：
      container.rebind<Weapon>("Weapon").to(Shuriken);


* 注意事项：
  · 理解IOC容器配置中的bind和toXXX（如toDynamicValue、toFactory等）
    ~ bind：是定义一个标识符（通常是类、接口或字符串），在后续@inject中表示的类型
    ~ toXXX：指定当解析绑定的标识符时，应该使用哪个类或工厂函数来创建实例
  · 依赖注入的时机问题：
    依赖注入发生在类实例化的过程中。当Inversify容器实例化一个类时，它会扫描该类上使用@inject装饰器的属性，并将注册到容器中的相应实例注入到类中。这通常发生在构造函数执行之前。这意味着，在类的构造函数执行时，依赖注入还没有完成，类中的@inject装饰器指定的属性会是undefined，直到Inversify完成依赖注入过程。
    解决方案：尽量不要在constructor进行操作，改为@postConstruct()
  · Class与IocContainer相互依赖问题：
    iocContainer.bind(CommandRegistry).toDynamicValue(() => {
      return new CommandRegistry(iocContainer)
    })
