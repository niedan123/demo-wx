async function 用来定义一个返回 AsyncFunction 对象的异步函数。异步函数是指通过事件循环异步执行的函数，它会通过一个隐式的 Promise 返回其结果。如果你在代码中使用了异步函数，就会发现它的语法和结构会更像是标准的同步函数。

&nbsp;

* 异步函数可以包含await指令，该指令会暂停异步函数的执行，并等待Promise执行，然后继续执行异步函数，并返回结果。


* 记住，await 关键字只在异步函数内有效。如果你在异步函数外使用它，会抛出语法错误。


* 注意，当异步函数暂停时，它调用的函数会继续执行(收到异步函数返回的隐式Promise)