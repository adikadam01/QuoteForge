import type {
    PaginationBlock,
    PaginationContainer,
} from "./DocumentLayoutEngine";

export interface RenderablePage {

    /**
     * Page number
     */
    pageNumber: number;

    /**
     * All containers rendered on this page
     */
    containers: PaginationContainer[];

    /**
     * Flat list of blocks
     */
    blocks: PaginationBlock[];

}