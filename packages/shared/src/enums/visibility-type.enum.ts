export enum VisibilityType {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
    FRIENDS_ONLY = "FRIENDS_ONLY"
}

// Єдине джерело відповідності enum ↔ visibility_types.id (сід у athlo-db.sql)
export const VISIBILITY_TYPE_ID: Record<VisibilityType, number> = {
    [VisibilityType.PRIVATE]: 1,
    [VisibilityType.PUBLIC]: 2,
    [VisibilityType.FRIENDS_ONLY]: 3,
};

export const VISIBILITY_TYPE_BY_ID: Record<number, VisibilityType> = {
    1: VisibilityType.PRIVATE,
    2: VisibilityType.PUBLIC,
    3: VisibilityType.FRIENDS_ONLY,
};
