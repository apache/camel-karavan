beans {
    myProcessor = processor { (2)
        it.in.body = 'Hello Camel K!'
    }
}

from('timer:tick?period=3000')
  .process("myProcessor")
  .to('log:info')