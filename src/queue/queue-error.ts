export class QueueEnqueueError extends Error {
  constructor(message: string = "Failed to enqueue job") {
    super(message);

    this.name = "QueueEnqueueError";
  }
}
