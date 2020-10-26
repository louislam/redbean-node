class Queue {

    public list : Promise<any>[] = [];

    async add(p : Promise<any>) {
        this.list.push(p);
    }

}

export const Q = new Queue();
