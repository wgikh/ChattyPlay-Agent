import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ReloadOutlined,
  ReadOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const API_BASE_URL = import.meta.env.VITE_NEWS_API_BASE_URL.replace(/\/+$/, '')
const API_URL = `${API_BASE_URL}/items`
const HOT_API_URL = `${API_BASE_URL}/hot-topics`

type ItemCategory = 'ai-models' | 'ai-products' | 'industry' | 'paper' | 'tip'
type Feed = '' | 'selected' | 'hot' | ItemCategory

interface NewsItem {
  id: string
  title: string
  summary?: string
  source: { name: string }
  links: { aihot: string; original?: string; story?: string }
  publishedAt: string
  discoveredAt: string
  category?: ItemCategory
  score?: number
  rank?: number
  sourceCount?: number
  signalCount?: number
  participantCount?: number
  sourceNames?: string[]
}

interface NewsResponse {
  items: NewsItem[]
  page: { hasMore: boolean; nextCursor: string | null }
}

interface HotResponse {
  items: Array<{
    rank: number
    id: string
    title: string
    source: { name: string }
    links: { aihot: string; original?: string; story?: string }
    sourceCount: number
    signalCount: number
    participantCount: number
    sourceNames: string[]
    latestAt: string
  }>
}

const categories: Feed[] = ['', 'selected', 'hot', 'ai-models', 'ai-products', 'industry', 'paper', 'tip']

const categoryKeys: Record<Feed, string> = {
  '': 'all',
  selected: 'selected',
  hot: 'hot',
  'ai-models': 'models',
  'ai-products': 'products',
  industry: 'industry',
  paper: 'paper',
  tip: 'opinion',
}

const Page = styled.div`
  --ink: #20241f;
  --muted: #697068;
  --line: #d6d8d0;
  --accent: #315f49;
  --paper: #fffef9;
  min-height: calc(100vh - 64px);
  color: var(--ink);
  background: #f4f3ed;
  font-family: "Noto Sans SC", "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
`

const Toolbar = styled.div`
  position: sticky;
  top: 64px;
  z-index: 10;
  border-bottom: 1px solid rgba(23, 35, 31, 0.1);
  background: rgba(255, 254, 249, 0.96);
`

const ToolbarInner = styled.div`
  display: flex;
  max-width: 1040px;
  margin: 0 auto;
  padding: 14px 24px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 760px) {
    padding: 12px 20px;
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }
`

const Tabs = styled.div`
  display: flex;
  gap: 22px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
`

const Tab = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  padding: 9px 0 7px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--ink)' : '#697068')};
  background: transparent;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: var(--accent);
  }

  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
`

const Search = styled.div`
  display: flex;
  min-width: 280px;
  border-bottom: 1px solid #aeb5ad;
  background: transparent;

  input {
    width: 100%;
    padding: 9px 4px 9px 0;
    border: 0;
    outline: 0;
    color: var(--ink);
    background: transparent;
    font: inherit;
  }

  > .anticon {
    padding: 0 2px 0 8px;
    color: var(--accent);
    align-self: center;
  }

  @media (max-width: 760px) {
    min-width: 0;
  }
`

interface NewsToolbarProps {
  feed: Feed
  query: string
  onSelect: (feed: Feed) => void
  onQuery: (query: string) => void
}

function NewsToolbar({ feed, query, onSelect, onQuery }: NewsToolbarProps) {
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (feed === 'hot') {
      setSearchText('')
      return
    }

    const timer = window.setTimeout(() => {
      const value = searchText.trim()
      const nextQuery = value.length === 1 ? '' : value
      if (nextQuery !== query) onQuery(nextQuery)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [feed, onQuery, query, searchText])

  return (
    <Toolbar>
      <ToolbarInner>
        <Tabs aria-label={t('news.categoryLabel')}>
          {categories.map(item => (
            <Tab
              key={item || 'all'}
              $active={feed === item}
              onClick={() => onSelect(item)}
            >
              {t(`news.categories.${categoryKeys[item]}`)}
            </Tab>
          ))}
        </Tabs>
        {feed !== 'hot' && (
          <Search role="search">
            <input
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
              placeholder={t('news.searchPlaceholder')}
              aria-label={t('news.searchLabel')}
            />
            <SearchOutlined aria-hidden />
          </Search>
        )}
      </ToolbarInner>
    </Toolbar>
  )
}

const Content = styled.main`
  max-width: 1088px;
  margin: 0 auto;
  padding: 40px 24px 88px;

  @media (max-width: 640px) {
    padding: 30px 18px 56px;
  }
`

const Timeline = styled.div`
  position: relative;

  > div:first-child > h2 { margin-top: 0; }

  &::before {
    position: absolute;
    top: 12px;
    bottom: 0;
    left: 139px;
    width: 1px;
    background: #cad5ce;
    content: '';
  }

  @media (max-width: 700px) {
    &::before { left: 7px; }
  }
`

const DateHeading = styled.h2`
  width: fit-content;
  margin: 50px 0 22px;
  padding: 7px 13px;
  border: 1px solid #d5ddd7;
  border-radius: 8px;
  color: #385849;
    background: #e8e9e2;
  font-family: "Songti SC", "Noto Serif SC", serif;
  font-size: 17px;
  font-weight: 600;

  @media (max-width: 700px) {
    margin: 38px 0 18px 28px;
  }
`

const Entry = styled.article`
  position: relative;
  display: grid;
  grid-template-columns: 102px 1fr;
  gap: 68px;
  padding-bottom: 22px;
  content-visibility: auto;
  contain-intrinsic-size: auto 220px;

  &::before {
    position: absolute;
    top: 7px;
    left: 134px;
    width: 12px;
    height: 12px;
    border: 3px solid #f2f5f1;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 1px #9cb2a7;
    content: '';
  }

  @media (max-width: 700px) {
    display: block;
    padding: 0 0 18px 28px;

    &::before { left: 2px; }
  }
`

const Time = styled.div`
  padding-top: 18px;
  color: var(--muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  text-align: right;

  @media (max-width: 700px) {
    padding-top: 0;
    margin-bottom: 8px;
    text-align: left;
  }
`

const Card = styled.div`
  padding: 20px 0 26px;
  border-top: 1px solid var(--line);

  @media (max-width: 640px) {
    padding: 18px 0 23px;
  }
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 12px;
  align-items: center;
  gap: 9px;
`

const Label = styled.span`
  padding: 3px 8px;
  border-radius: 5px;
  color: var(--accent);
  background: #e2e8e1;
  font-weight: 700;
`

const Score = styled.span`
  margin-left: auto;
  color: #8a6952;
  font-variant-numeric: tabular-nums;

  @media (max-width: 520px) {
    width: 100%;
    margin-left: 0;
  }
`

const ItemTitle = styled.h3`
  margin: 0;
  font-family: "Songti SC", "Noto Serif SC", serif;
  font-size: clamp(20px, 2.4vw, 26px);
  line-height: 1.48;

  a {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover { color: var(--accent); }
  a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`

const Summary = styled.p`
  max-width: 740px;
  margin: 13px 0 17px;
  color: #626c66;
  font-size: 15px;
  line-height: 1.8;
`

const ReadLink = styled.a`
  display: inline-flex;
  padding-bottom: 2px;
  border-bottom: 1px solid #a9bdb3;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;

  .anticon { margin-left: 5px; transition: transform 0.2s ease; }
  &:hover .anticon { transform: translateX(3px); }
`

const Empty = styled.div`
  padding: 90px 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--paper);
  color: var(--muted);
  text-align: center;

  strong {
    display: block;
    margin-bottom: 10px;
    color: var(--ink);
    font-family: "Songti SC", serif;
    font-size: 24px;
  }
`

const LoadMore = styled.button`
  display: block;
  min-width: 150px;
  margin: 26px auto 0;
  padding: 12px 24px;
  border: 1px solid #9fa39b;
  border-radius: 999px;
  color: #fff;
  background: var(--accent);
  font: inherit;
  cursor: pointer;

  &:hover:not(:disabled) { background: #244f3f; }
  &:disabled { cursor: wait; opacity: 0.55; }
`

const Loading = styled.div`
  padding: 80px 0;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--paper);
  color: var(--muted);
  text-align: center;
`

const HotBoard = styled.section`
  border: 1px solid rgba(39, 68, 55, 0.12);
  border-radius: 3px;
  background: var(--paper);
  overflow: hidden;
`

const HotBoardHeader = styled.header`
  display: flex;
  padding: 24px 28px;
  border-bottom: 1px solid var(--line);
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  h2 {
    margin: 0 0 6px;
    font: 600 25px/1.3 "Songti SC", "Noto Serif SC", serif;
  }

  p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.6;
  }

  span {
    flex: 0 0 auto;
    color: #9b4d3a;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  @media (max-width: 640px) {
    padding: 20px 18px;
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
`

const HotList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
`

const HotRow = styled.li`
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  padding: 25px 28px;
  border-bottom: 1px solid var(--line);
  gap: 20px;
  content-visibility: auto;
  contain-intrinsic-size: auto 120px;

  &:last-child { border-bottom: 0; }
  @media (max-width: 640px) {
    grid-template-columns: 40px minmax(0, 1fr);
    padding: 21px 18px;
    gap: 12px;
  }
`

const HotRank = styled.span<{ $top: boolean }>`
  color: ${({ $top }) => ($top ? '#a64c36' : '#9aa29d')};
  font: 700 25px/1.2 Georgia, serif;
  font-variant-numeric: tabular-nums;
`

const HotContent = styled.div`
  min-width: 0;

  h3 {
    margin: 0;
    font: 600 clamp(18px, 2.2vw, 23px)/1.5 "Songti SC", "Noto Serif SC", serif;
  }

`

const HotMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 13px;
  color: var(--muted);
  font-size: 12px;
  align-items: center;
  gap: 8px 14px;

`

const HotSources = styled.details`
  min-width: 0;

  summary {
    display: inline-flex;
    min-height: 36px;
    color: var(--accent);
    font-weight: 700;
    align-items: center;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker { display: none; }

  summary::after {
    margin-left: 5px;
    content: '›';
    transition: transform 0.15s ease;
  }

  &[open] {
    flex-basis: 100%;
  }

  &[open] summary::after { transform: rotate(90deg); }

  div {
    display: flex;
    width: 100%;
    margin: 6px 0 8px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: #f6f8f5;
    flex-wrap: wrap;
    gap: 7px 16px;
  }

  div span {
    padding: 2px 0;
    color: #59645e;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
`

const HotStats = styled.div`
  display: flex;
  min-width: 88px;
  padding-left: 20px;
  border-left: 1px solid var(--line);
  align-items: flex-end;
  flex-direction: column;
  justify-content: center;
  gap: 8px;

  div {
    display: inline-flex;
    min-width: 58px;
    color: var(--muted);
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    font-size: 12px;
  }

  .anticon { color: var(--accent); font-size: 15px; }

  @media (max-width: 640px) {
    grid-column: 2;
    padding: 10px 0 0;
    border-top: 1px solid var(--line);
    border-left: 0;
    align-items: center;
    flex-direction: row;
    justify-content: flex-start;
    gap: 18px;
  }
`

export default function News() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<NewsItem[]>([])
  const [feed, setFeed] = useState<Feed>('')
  const [renderedFeed, setRenderedFeed] = useState<Feed>('')
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNews = useCallback(async (nextCursor?: string, signal?: AbortSignal) => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams({
      mode: feed === 'selected' ? 'selected' : 'all',
      window: '7d',
      limit: '30',
      by: 'timeline',
    })
    if (feed && feed !== 'selected' && feed !== 'hot') params.set('category', feed)
    if (query) params.set('q', query)
    if (nextCursor) params.set('cursor', nextCursor)

    try {
      const response = await fetch(feed === 'hot' ? HOT_API_URL : `${API_URL}?${params}`, {
        cache: 'no-store',
        signal,
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (feed === 'hot') {
        const data = await response.json() as HotResponse
        setItems(data.items.map(item => ({
          ...item,
          publishedAt: item.latestAt,
          discoveredAt: item.latestAt,
        })))
        setCursor(null)
        setHasMore(false)
      } else {
        const data = await response.json() as NewsResponse
        setItems(previous => nextCursor ? [...previous, ...data.items] : data.items)
        setCursor(data.page.nextCursor)
        setHasMore(data.page.hasMore)
      }
      setRenderedFeed(feed)
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(t('news.loadError'))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [feed, query, t])

  useEffect(() => {
    const controller = new AbortController()
    loadNews(undefined, controller.signal)
    return () => controller.abort()
  }, [loadNews])

  const selectCategory = useCallback((value: Feed) => {
    if (value === 'hot') {
      setQuery('')
    }
    setHasMore(false)
    setFeed(value)
    document.documentElement.scrollTop = 0
  }, [])

  const updateQuery = useCallback((value: string) => {
    setHasMore(false)
    setQuery(value)
    document.documentElement.scrollTop = 0
  }, [])

  let currentDate = ''
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'zh-CN'
  const dateFormats = useMemo(() => ({
    key: new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    }),
    heading: new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', weekday: 'long',
    }),
    time: new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false,
    }),
  }), [locale])

  return (
    <Page>
      <NewsToolbar
        feed={feed}
        query={query}
        onSelect={selectCategory}
        onQuery={updateQuery}
      />

      <Content>
        {error && !items.length ? (
          <Empty>
            <strong>{t('news.errorTitle')}</strong>
            <p>{error}</p>
            <LoadMore onClick={() => loadNews()}><ReloadOutlined /> {t('news.retry')}</LoadMore>
          </Empty>
        ) : loading && !items.length ? (
          <Loading><ClockCircleOutlined /> {t('news.loading')}</Loading>
        ) : !items.length ? (
          <Empty>
            <strong>{t('news.emptyTitle')}</strong>
            <p>{t('news.emptyDescription')}</p>
          </Empty>
        ) : renderedFeed === 'hot' ? (
          <HotBoard>
            <HotBoardHeader>
              <div>
                <h2>{t('news.hotList')}</h2>
                <p>{t('news.hotDescription')}</p>
              </div>
              <span>{t('news.liveUpdate')}</span>
            </HotBoardHeader>
            <HotList>
              {items.map(item => {
                return (
                  <HotRow key={item.id}>
                    <HotRank $top={(item.rank || 0) <= 3}>
                      {String(item.rank).padStart(2, '0')}
                    </HotRank>
                    <HotContent>
                      <h3>{item.title}</h3>
                      <HotMeta>
                        {item.sourceCount && item.sourceNames?.length ? (
                          <HotSources>
                            <summary>{t('news.hotSources', { count: item.sourceCount })}</summary>
                            <div>
                              {item.sourceNames.map((source, index) => (
                                <span key={`${source}-${index}`}>{source}</span>
                              ))}
                            </div>
                          </HotSources>
                        ) : (
                          <span>{t('news.hotSources', { count: 0 })}</span>
                        )}
                        <span>{t('news.updatedAt', {
                          date: dateFormats.heading.format(new Date(item.publishedAt)),
                          time: dateFormats.time.format(new Date(item.publishedAt)),
                        })}</span>
                      </HotMeta>
                    </HotContent>
                    <HotStats>
                      <div title={t('news.hotSourcesTooltip')}><ReadOutlined /> {item.sourceCount}</div>
                      <div title={t('news.hotSignalsTooltip')}><FireOutlined /> {item.signalCount}</div>
                      <div title={t('news.hotParticipantsTooltip')}><TeamOutlined /> {item.participantCount}</div>
                    </HotStats>
                  </HotRow>
                )
              })}
            </HotList>
          </HotBoard>
        ) : (
          <Timeline>
            {items.map(item => {
              const timelineAt = item.discoveredAt || item.publishedAt
              const date = new Date(timelineAt)
              const dateKey = dateFormats.key.format(date)
              const showDate = dateKey !== currentDate
              currentDate = dateKey
              const link = item.links.original || item.links.aihot

              return (
                <div key={item.id}>
                  {showDate && <DateHeading>{dateFormats.heading.format(date)}</DateHeading>}
                  <Entry>
                    <Time>{dateFormats.time.format(date)}</Time>
                    <Card>
                      <Meta>
                        <Label>{t(`news.categories.${categoryKeys[item.category || '']}`)}</Label>
                        <span>{item.source.name}</span>
                        {item.score !== undefined && (
                          <Score>{t('news.score', { score: item.score })}</Score>
                        )}
                      </Meta>
                      <ItemTitle>
                        <a href={link} target="_blank" rel="noreferrer">{item.title}</a>
                      </ItemTitle>
                      {item.summary && <Summary>{item.summary}</Summary>}
                      <ReadLink href={link} target="_blank" rel="noreferrer">
                        {t('news.readOriginal')} <ArrowRightOutlined />
                      </ReadLink>
                    </Card>
                  </Entry>
                </div>
              )
            })}
          </Timeline>
        )}

        {hasMore && (
          <LoadMore disabled={loading} onClick={() => cursor && loadNews(cursor)}>
            {loading ? t('news.loadingMore') : t('news.loadMore')}
          </LoadMore>
        )}
      </Content>
    </Page>
  )
}
