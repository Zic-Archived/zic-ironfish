#!/bin/python
import time, os, multiprocessing

def deposit(delay):
  time.sleep(delay*15)
  while True:
    os.system('yarn ironfish deposit --confirm')

def main():
  procs = []
  for p in range(3):
    name = "proc-" + str(p)
    proc = multiprocessing.Process(target=deposit, name=name, args=(p,))
    proc.start()
    procs.append(proc)

  try:
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    for proc in procs:
      proc.terminate()
      proc.join()

if __name__ == '__main__':
  main()
