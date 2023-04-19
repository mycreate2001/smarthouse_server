export interface DatabaseType<T>{
    [id:string]:T
}

export type DataOptionWithId<T>=Partial<T>&{id:string}