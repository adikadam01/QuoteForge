//DocumnetLayoutEngine.ts


/**
 * ============================================================================
 * PDF Pagination Engine
 * ============================================================================
 *
 * Purpose:
 * Responsible ONLY for pagination.
 *
 * It DOES NOT:
 *  - Render React components
 *  - Modify quotation data
 *  - Change styles
 *  - Change business logic
 *
 * It ONLY decides:
 *  - When a new page should start
 *  - Which content belongs to which page
 *
 * ============================================================================
 */

export enum BlockContentType {
    Text = "text",

    BulletList = "bullet-list",

    Table = "table",

    Container = "container",

    Header = "header",

    Footer = "footer",

    Image = "image",
}

export enum BlockRenderKind {

    Paragraph = "paragraph",

    Bullet = "bullet",

    Numbered = "numbered",

    Heading = "heading",

    Service = "service",

}

export enum BlockType {
    Header = "header",

    Section = "section",

    Container = "container",

    Atomic = "atomic",

    Splittable = "splittable",
}

export interface PaginationContainer {

    /**
     * Unique container id
     */
    id: string;

    /**
     * Container title
     */
    title?: string;

    /**
     * Original blocks belonging to this container
     */
    originalBlocks: PaginationBlock[];

    /**
     * Blocks rendered on the current page
     */
    renderedBlocks: PaginationBlock[];

    /**
     * Restart the container on a new page
     */
    restartOnNewPage?: boolean;

    /**
     * Close the border before the page ends
     */
    closeBorderOnBreak?: boolean;

    /**
     * This container is a continuation
     * from a previous page.
     */
    isContinuation?: boolean;

    /**
     * True only on the final
     * rendered piece.
     */
    isLastPart?: boolean;
}

export interface PaginationSection {

    /**
     * Section id
     */
    id: string;

    /**
     * Section title
     */
    title?: string;

    /**
     * Should every page begin with the header?
     */
    includeHeader?: boolean;

    /**
     * Containers inside this section
     */
    containers: PaginationContainer[];

}

export interface PaginationBlock {

    id: string;

    type: BlockType;

    contentType: BlockContentType;

    renderKind?: BlockRenderKind;

    content?: unknown;

    estimatedHeight?: number;

    keepTogether?: boolean;

    restartContainer?: boolean;

    data?: unknown;
}

export interface PDFPage {

    pageNumber: number;

    blocks: PaginationBlock[];

    containers: PaginationContainer[];
}

export interface PaginationOptions {

    /**
     * Total page height
     */
    pageHeight: number;

    /**
     * Header height
     */
    headerHeight: number;

    /**
     * Top margin
     */
    topMargin: number;

    /**
     * Bottom margin
     */
    bottomMargin: number;
}

export const LayoutConstants = {

    LineHeight: 16,

    BulletHeight: 18,

    HeadingHeight: 24,

    SectionSpacing: 14,

    TableRowHeight: 28,

    HeaderHeight: 90,

};

/**
 * ============================================================================
 * Pagination Engine
 * ============================================================================
 */

export class PDFPaginationEngine {

    private readonly printableHeight: number;

    constructor(
        private readonly options: PaginationOptions
    ) {

        this.printableHeight =
            options.pageHeight
            - options.headerHeight
            - options.topMargin
            - options.bottomMargin;

    }


    private estimateHeight(
        block: PaginationBlock
    ): number {

        switch (block.contentType) {

            case BlockContentType.Text: {

                const text = String(block.content ?? "");

                const estimatedLines =
                    Math.max(1, Math.ceil(text.length / 60));

                switch (block.renderKind) {

                    case BlockRenderKind.Heading:
                        return 24;

                    case BlockRenderKind.Bullet:
                        return estimatedLines * 16;

                    case BlockRenderKind.Numbered:
                        return estimatedLines * 16;

                    case BlockRenderKind.Paragraph:
                        return estimatedLines * 16;

                    default:
                        return estimatedLines * 16;
                }

            }



            case BlockContentType.Table:

                return (
                    Array.isArray(block.content)
                        ? block.content.length
                        : 0
                ) * LayoutConstants.TableRowHeight;

            case BlockContentType.Container:

                if (block.renderKind === BlockRenderKind.Service) {

                    return 180;

                }

                return LayoutConstants.HeadingHeight + 120;

            case BlockContentType.Image:

                return 80;

            default:

                return 40;
        }

    }

    private cloneContainer(
        container: PaginationContainer,
        continuation = false
    ): PaginationContainer {

        return {

            ...container,

            renderedBlocks: [],

            isContinuation: continuation,

            isLastPart: false,

        };

    }


    private createNewPage(
        pageNumber: number
    ): PDFPage {

        return {

            pageNumber,

            blocks: [],

            containers: [],
        };

    }

    /**
     * Split blocks into pages
     */
    paginate(
        sections: PaginationSection[]
    ): PDFPage[] {

        const pages: PDFPage[] = [];

        let currentPage = this.createNewPage(1);

        let activeContainer:
            PaginationContainer | null = null;

        let usedHeight = 0;

        for (const section of sections) {

            if (currentPage.blocks.length > 0) {

                pages.push(currentPage);

                currentPage = this.createNewPage(
                    pages.length + 1
                );

                usedHeight = 0;

            }

            for (const container of section.containers) {

                let pageContainer =
                    this.cloneContainer(container);

                currentPage.containers.push(pageContainer);

                for (const block of container.originalBlocks) {

                    const blockHeight =
                        this.estimateHeight(block);

                    // console.log({
                    //     id: block.id,
                    //     kind: block.renderKind,
                    //     height: blockHeight,
                    // });

                    const safetyMargin = 8;

                    const exceedsPage =
                        usedHeight + blockHeight >
                        this.printableHeight - safetyMargin;

                    if (exceedsPage) {

                        pageContainer.isLastPart = false;

                        pages.push(currentPage);

                        currentPage = this.createNewPage(
                            pages.length + 1
                        );

                        pageContainer = this.cloneContainer(
                            container,
                            true
                        );

                        currentPage.containers.push(pageContainer);

                        usedHeight = 0;
                    }

                    // console.log({
                    //     page: currentPage.pageNumber,
                    //     usedHeight,
                    //     blockHeight,
                    //     printableHeight: this.printableHeight,
                    //     remaining: this.printableHeight - usedHeight,
                    //     nextBlock: block.id,
                    // });
                    pageContainer.renderedBlocks.push(block);

                    currentPage.blocks.push(block);

                    usedHeight += blockHeight;
                    // console.log(
                    //     pageContainer.id,
                    //     block.id,
                    //     blockHeight,
                    //     usedHeight
                    // );
                }

                pageContainer.isLastPart = true;
            }

        }

        if (currentPage.blocks.length > 0) {

            pages.push(currentPage);

        }

        return pages;

    }

}