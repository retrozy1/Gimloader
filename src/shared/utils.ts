export function englishList(items: string[], combiner = "and") {
    if(items.length === 1) return items[0];
    else if(items.length === 2) return `${items[0]} ${combiner} ${items[1]}`;
    else return `${items.slice(0, -1).join(", ")}, ${combiner} ${items.at(-1)}`;
}
