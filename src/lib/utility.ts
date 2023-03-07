export function toArray<T>(data:T|T[]):T[]{
    if(typeof data==undefined) return [];
    return Array.isArray(data)?data:[data]
}