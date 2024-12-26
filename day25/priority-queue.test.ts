export class PriorityQueue<T> {
  private heap: T[];
  private prioritizer: (a: T, b: T) => number;
  private comparator: (a: T, b: T) => boolean;

  constructor(prioritizer: (a: T, b: T) => number, comparator: (a: T, b: T) => boolean) {
    this.heap = [];
    this.prioritizer = prioritizer;
    this.comparator = comparator;
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

  remove(item: T): void {
    this.heap = this.heap.filter(i => !this.comparator(i, item));
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(): void {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.prioritizer(this.heap[index], this.heap[parentIndex]) < 0) {
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

      if (leftChildIndex < this.heap.length && this.prioritizer(this.heap[leftChildIndex], this.heap[smallestIndex]) < 0) {
        smallestIndex = leftChildIndex;
      }

      if (rightChildIndex < this.heap.length && this.prioritizer(this.heap[rightChildIndex], this.heap[smallestIndex]) < 0) {
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

test("heap-priority-queue", () => {
    const prioritizer = (a: number, b: number): number  => { return a - b; };
    const comparator = (a: number, b: number): boolean => { return a === b };
    const queue: PriorityQueue<number> = new PriorityQueue<number>(prioritizer, comparator);

    queue.enqueue(5);
    queue.enqueue(2);
    queue.enqueue(8);
    queue.enqueue(3);
    queue.enqueue(4);
    queue.enqueue(3);

    expect(queue.dequeue()).toBe(2);
    expect(queue.dequeue()).toBe(3);
    expect(queue.dequeue()).toBe(3);
    expect(queue.dequeue()).toBe(4);
    expect(queue.dequeue()).toBe(5);
    expect(queue.dequeue()).toBe(8);
    expect(queue.dequeue()).toBe(null);

    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    queue.remove(2);

    expect(queue.dequeue()).toBe(1);
    expect(queue.dequeue()).toBe(3);
    expect(queue.dequeue()).toBe(null);

});
