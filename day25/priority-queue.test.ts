export type QueueItem = {
    priority: number;
}

/**
 * https://github.com/apache/hadoop/blob/a55d6bba71c81c1c4e9d8cd11f55c78f10a548b0/hadoop-common-project/hadoop-common/src/main/java/org/apache/hadoop/util/PriorityQueue.java
 */
/*
export class HadoopPriorityQueue<T extends QueueItem> {

    private items: T[];

    constructor() {
        this.items = [];
    }

    public enqueue(item: T): void {
        this.items.push(item);
        this.upHeap();
    }

    public dequeue(): T | null {
        if(this.items.length === 0) return null;
        let result: T = this.items.shift()!;
        let last: T | undefined = this.items.pop();
        if(last !== undefined) {
            this.items.unshift(last);
            this.downHeap();
        }
        return result;
    }

    public size(): number {
        return this.items.length;
    }

    public clear(): void {
        this.items = [];
    }

    private lessThan(a: T, b: T): boolean {
        return a.priority < b.priority;
    }

    private upHeap(): void {
        console.log(`up heap before: ${this.items.map(i => i.priority).join(',')}`);
        let i: number = this.items.length - 1;
        let node: T = this.items[i];
        let j: number = Math.floor(this.items.length / 2);
        console.log(`up heap i: ${i} node: ${node.priority} j: ${j} items[j]: ${this.items[j].priority} lessThan: ${this.lessThan(node, this.items[j])}`);
        while(j > 0 && this.lessThan(node, this.items[j])) {
            this.items[i] = this.items[j];
            i = j;
            j = Math.floor(j / 2);
            console.log(`up heap while loop - i: ${i} j: ${j} items[j]: ${this.items[j].priority}`);
        }
        this.items[i] = node;
        console.log(`up heap after: ${this.items.map(i => i.priority).join(',')}`);
    }

    private downHeap(): void {
        console.log(`down heap before: ${this.items.map(i => i.priority).join(',')}`);
        let i: number = 1;
        let node: T = this.items[i];
        let j: number = i * 2;
        let k: number = j + 1;
        if(k < this.items.length && this.lessThan(this.items[k], this.items[j])) {
            j = k;
        }
        while(j < this.items.length && this.lessThan(this.items[j], node)) {
            this.items[i] = this.items[j];
            i = j;
            j = i * 2;
            k = j + 1;
            if(k < this.items.length && this.lessThan(this.items[k], this.items[j])) {
                j = k;
            }
        }
        this.items[i] = node;
        console.log(`down heap after: ${this.items.map(i => i.priority).join(',')}`);
    }
}
*/

export class PriorityQueue<T extends QueueItem> {

    private items: T[] = [];

    constructor() {}

    public enqueue(item: T) {
        let added: boolean = false;
        for(let i = 0; i < this.items.length; i++) {
            if(item.priority < this.items[i].priority) {
                this.items.splice(i, 0, item);
                added = true;
                break;
            }
        }
        if(!added) {
            this.items.push(item);
        }
    }

    public dequeue(): T | null {
        if(this.items.length === 0) return null;
        return this.items.shift()!;
    }

    peek(): T | null {
        if(this.items.length === 0) return null;
        return this.items[0];
    }

    size(): number {
        return this.items.length;
    }

}

class HeapPriorityQueue<T extends QueueItem> {
    private heap: T[];
    private compare: (a: T, b: T) => number;
  
    constructor(compare: (a: T, b: T) => number) {
      this.heap = [];
      this.compare = compare;
    }
  
    enqueue(item: T): void {
      this.heap.push(item);
      this.bubbleUp();
    }
  
    dequeue(): T | null {
      if (this.heap.length === 0) {
        return null;
      }
  
      const root = this.heap[0];
      const last = this.heap.pop()!;
      if (this.heap.length > 0) {
        this.heap[0] = last;
        this.bubbleDown();
      }
  
      return root;
    }
  
    peek(): T | undefined {
      return this.heap[0];
    }
  
    get size(): number {
      return this.heap.length;
    }
  
    private bubbleUp(): void {
      let index = this.heap.length - 1;
      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
          [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
          index = parentIndex;
        } else {
          break;
        }
      }
    }
  
    private bubbleDown(): void {
      let index = 0;
      while (index < this.heap.length) {
        const leftChildIndex = 2 * index + 1;
        const rightChildIndex = 2 * index + 2;
        let smallestIndex = index;
  
        if (leftChildIndex < this.heap.length && this.compare(this.heap[leftChildIndex], this.heap[smallestIndex]) < 0) {
          smallestIndex = leftChildIndex;
        }
  
        if (rightChildIndex < this.heap.length && this.compare(this.heap[rightChildIndex], this.heap[smallestIndex]) < 0) {
          smallestIndex = rightChildIndex;
        }
  
        if (smallestIndex !== index) {
          [this.heap[index], this.heap[smallestIndex]] = [this.heap[smallestIndex], this.heap[index]];
          index = smallestIndex;
        } else {
          break;
        }
      }
    }
  }
  


test("priority-queue", () => {
    const queue: PriorityQueue<QueueItem> = new PriorityQueue<QueueItem>();

    queue.enqueue({ priority: 5});
    queue.enqueue({ priority: 2 });
    queue.enqueue({ priority: 8 });
    queue.enqueue({ priority: 3});
    queue.enqueue({ priority: 4 });
    queue.enqueue({ priority: 3 });

    expect(queue.dequeue()!.priority).toBe(2);
    expect(queue.dequeue()!.priority).toBe(3);
    expect(queue.dequeue()!.priority).toBe(3);
    expect(queue.dequeue()!.priority).toBe(4);
    expect(queue.dequeue()!.priority).toBe(5);
    expect(queue.dequeue()!.priority).toBe(8);
    expect(queue.dequeue()).toBe(null);
});

test("heap-priority-queue", () => {
    const comparator = (a: QueueItem, b: QueueItem): number  => { return a.priority - b.priority; };
    const queue: HeapPriorityQueue<QueueItem> = new HeapPriorityQueue<QueueItem>(comparator);

    queue.enqueue({ priority: 5});
    queue.enqueue({ priority: 2 });
    queue.enqueue({ priority: 8 });
    queue.enqueue({ priority: 3});
    queue.enqueue({ priority: 4 });
    queue.enqueue({ priority: 3 });

    expect(queue.dequeue()!.priority).toBe(2);
    expect(queue.dequeue()!.priority).toBe(3);
    expect(queue.dequeue()!.priority).toBe(3);
    expect(queue.dequeue()!.priority).toBe(4);
    expect(queue.dequeue()!.priority).toBe(5);
    expect(queue.dequeue()!.priority).toBe(8);
    expect(queue.dequeue()).toBe(null);
});
/*
test("hadoop-priority-queue", () => {
    const queue: HadoopPriorityQueue<QueueItem> = new HadoopPriorityQueue<QueueItem>();

    queue.enqueue({ priority: 5 });
    queue.enqueue({ priority: 2 });
    queue.enqueue({ priority: 8 });
    queue.enqueue({ priority: 3 });
    queue.enqueue({ priority: 4 });
    queue.enqueue({ priority: 3 });

    expect(queue.dequeue()!.priority).toBe(2);
    expect(queue.dequeue()!.priority).toBe(3);
    expect(queue.dequeue()!.priority).toBe(3);
    expect(queue.dequeue()!.priority).toBe(4);
    expect(queue.dequeue()!.priority).toBe(5);
    expect(queue.dequeue()!.priority).toBe(8);
    expect(queue.dequeue()).toBe(null);
});
*/