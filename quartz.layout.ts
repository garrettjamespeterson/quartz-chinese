import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    // Top navigation bar for Chinese lesson pages
    Component.ConditionalRender({
      component: Component.Flex({
        components: [
          { Component: Component.PageTitle() },
          { Component: Component.Spacer() },
          {
            Component: Component.Search(),
            grow: true,
          },
          { Component: Component.Darkmode() },
          { Component: Component.ReaderMode() },
        ],
      }),
      condition: (page) => page.fileData.frontmatter?.audience === "chinese",
    }),
  ],
  afterBody: [
    Component.ChineseSettings(),
    Component.AudioPlayer(),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.CollapsibleGraph(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    // Standard left sidebar for non-Chinese pages
    Component.ConditionalRender({
      component: Component.PageTitle(),
      condition: (page) => page.fileData.frontmatter?.audience !== "chinese",
    }),
    Component.ConditionalRender({
      component: Component.MobileOnly(Component.Spacer()),
      condition: (page) => page.fileData.frontmatter?.audience !== "chinese",
    }),
    Component.ConditionalRender({
      component: Component.Flex({
        components: [
          {
            Component: Component.Search(),
            grow: true,
          },
          { Component: Component.Darkmode() },
          { Component: Component.ReaderMode() },
        ],
      }),
      condition: (page) => page.fileData.frontmatter?.audience !== "chinese",
    }),
    Component.ConditionalRender({
      component: Component.Explorer(),
      condition: (page) => page.fileData.frontmatter?.audience !== "chinese",
    }),
    // Core vocabulary for Chinese pages (left sidebar)
    Component.ConditionalRender({
      component: Component.CoreVocab(),
      condition: (page) => page.fileData.frontmatter?.audience === "chinese",
    }),
  ],
  right: [
    Component.DesktopOnly(
      Component.ConditionalRender({
        component: Component.VocabWall(),
        condition: (page) => page.fileData.frontmatter?.audience === "chinese",
      }),
    ),
    Component.DesktopOnly(
      Component.ConditionalRender({
        component: Component.TableOfContents(),
        condition: (page) => page.fileData.frontmatter?.audience !== "chinese",
      }),
    ),
    Component.ConditionalRender({
      component: Component.Backlinks(),
      condition: (page) => page.fileData.frontmatter?.audience !== "chinese",
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [],
}
