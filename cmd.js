/**
 * @module CMD
 * @uses Window
 * @user 子丶言
 * @create 2015/03/26
 */

;(function (Global) {
    var modules = {},
        isFunciton = function isFunction(obj) {
            return Object.prototype.toString.call(obj) === '[object Function]';
        },
        isArray = function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },
        extend = function extend(target, source) {
            for (var key in source) {
                target[key] = source[key];
            }
            return target;
        },
        getExport = function getExport(id) {
            return modules[id].exports;
        };
    
    /**
     * @method parseDeps
     * @param deps {Array} 依赖模块列表
     * @return {Array} 去重后的依赖模块列表
     * @description 解析依赖模块，判断是否已经载入，并对这些模块进行简单去重
     * @modify 子丶言 2015/03/27
     */
    function parseDeps(deps) {
        var depList = [];
        deps.forEach(function (id) {
            if (depList.indexOf(id) === -1) {
                if (id in modules) {
                    depList.push(id);
                } else {
                    throw '依赖模块未完全载入：' + id;
                }
            }
        });
        return depList;
    }
    
    /**
     * @method build
     * @param module {Object} 在函数内部，该对象只有三种属性id、deps和factory(*)会被程序处理
     * @return {Object} 返回函数对外开放的API对象
     * @description 获取该模块的公共API，并自动对依赖模块进行初始导入
     * @modify 子丶言 2015/03/27
     */
    function build(module) {
        module.exports = {};
        
        var parameters = [Global.require, module.exports, module],
            exports = module.factory.apply(module, 'deps' in module ? parameters.concat(module.deps.map(getExport)) : parameters);
        
        exports = !!exports ? extend(module.exports, exports) : module.exports;
        
        if ('id' in module) {
            if (module.id in modules) {
                throw '此模块已经存在：' + module.id;
            } else {
                modules[module.id] = {id: module.id, deps: module.deps || [], exports: exports};
                return modules[module.id].exports;
            }
        } else {
            return exports;
        }
    }
    
    /**
     * @method require
     * @param id {String|Array} 依赖模块id(列表)
     * @param callback {Function} 成功载入依赖模块后，自执行回调函数
     * @param exports [exports={}]* {Object} 用于内部递归调用，该对象为相关模块的公共API集合
     * @return {Object} 模块的公共API
     * @description 该函数执行后会自动注册为全局方法，用于获取由define定义的模块API
     * @modify 子丶言 2015/03/27
     */
    Global.require = function require(id, callback, exports) {
        if (isArray(id)) {
            exports = exports || {};
            id.forEach(function (name) {
                exports[name] = Global.require(name, callback, exports);
            });
            return exports;
        } else {
            if (id in modules) {
                if (isFunciton(callback)) {
                    callback(modules[id].exports);
                }
                return modules[id].exports;
            } else {
                throw '该模块尚未构建：' + id;
            }
        }
    };
    
    /**
     * @method define
     * @param id {String|Array|Function} 模块id或依赖模块列表或工厂函数
     * @param deps {*} 可能为任意类型的变量，但主要以依赖模块列表和工厂函数的形态存在
     * @param factory {Function} 工厂函数
     * @return {Object} 默认返回模块公共API
     * @description 该函数执行后会自动注册为全局方法，用于封装函数模块，默认返回封装后的公共API。
     *              该函数的参数可选，若构建后的模块对象无id，则该模块不会被`注册`到模块列表中，并以匿名函数的形态返回公共API
     *              模块的id可以采用树状或命名空间形式进行注册，即HMY/tools/parse或HMY.tools.parse的形式，建议统一采用HMY/tools/parse形式
     *              目前尚不支持树状模块调用，即./或../形式；
     * @modify 子丶言 2015/03/27
     */
    Global.define = function define(id, deps, factory) {
        if (arguments.length === 3) {
            return build({id: id, deps: parseDeps(deps), factory: factory});
        } else if (arguments.length === 2) {
            if (isArray(id)) {
                return build({deps: parseDeps(id), factory: deps});
            } else {
                if (isFunciton(deps)) {
                    return build({id: id, factory: deps});
                } else {
                    modules[id] = {id: id, exports: deps};
                    return deps;
                }
            }
        } else if (isFunciton(id)) {
            return build({factory: id});
        } else {
            return id;
        }
    };
}(window));

console.log('require' in window);
console.log('define' in window);

define('HMY', {
    version: '4.0'
});

define('tool', ['HMY'], function (require, exports, module, hmy) {
    var HMY = require('HMY');
    console.log('HMY', HMY);
    console.log('hmy', hmy);
    
    exports.add = function (x, y) {
        return x + y;
    }
    
    console.log(module);
});

define(function (require, exports, module) {
    var tools = require('tool');
    console.log('plus', tools);
    var add = tools.add;
    console.log(add(8, 1));
    
    module.id = 'plus';
    
    exports.half = function (x) {
        return x /2;
    };
    
    return {
        'double': function double(x) {
            return add(x, x);
        },
        'triple': function triple(x) {
            return add(this.double(x), x);
        }
    };
});

define('test', function (require, exports) {
    var plus = require('plus');
    console.log('test', plus);
    console.log('half', plus.half(8));
    console.log('double', plus.double(8));
    console.log('triple', plus.triple(8));
    console.log(this);
    
    var all = require(['HMY', 'plus'], function (HMY, plus) {
        console.log('HMY, plus', HMY, plus);
    });
    
    console.log('all', all);
});
