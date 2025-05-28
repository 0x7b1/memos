import { Link as MLink, Tooltip } from "@mui/joy";
import { useEffect, useState } from "react";
import { markdownServiceClient } from "@/grpcweb";
import { workspaceStore } from "@/store/v2";
import { LinkMetadata, Node } from "@/types/proto/api/v1/markdown_service";
import Renderer from "./Renderer";

interface Props {
  url: string;
  content?: Node[];
}

const getDisplayUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const isHttpDefaultPort = urlObj.protocol === "http:" && (urlObj.port === "80" || urlObj.port === "");
    const isHttpsDefaultPort = urlObj.protocol === "https:" && (urlObj.port === "443" || urlObj.port === "");

    if (urlObj.pathname === "/" && !urlObj.search && !urlObj.hash && (isHttpDefaultPort || isHttpsDefaultPort)) {
      return urlObj.hostname.replace(/^www\./, "");
    }
    return url;
  } catch {
    return url;
  }
};

const getFaviconWithGoogleS2 = (url: string, size: number = 128) => {
  try {
    const urlObject = new URL(url);
    return `https://www.google.com/s2/favicons?sz=${size}&domain=${urlObject.hostname}`;
  } catch {
    return undefined;
  }
};

const Link: React.FC<Props> = ({ content, url }: Props) => {
  const workspaceMemoRelatedSetting = workspaceStore.state.memoRelatedSetting;
  const [initialized, setInitialized] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | undefined>();
  const [favicon, setFavicon] = useState<string | undefined>(undefined);

  useEffect(() => {
    const favUrl = getFaviconWithGoogleS2(url, 64);
    setFavicon(favUrl);
  }, [url]);

  const handleMouseEnter = async () => {
    if (!workspaceMemoRelatedSetting.enableLinkPreview) {
      return;
    }

    setShowTooltip(true);
    if (!initialized) {
      try {
        const linkMetadata = await markdownServiceClient.getLinkMetadata({ link: url });
        setLinkMetadata(linkMetadata);
      } catch (error) {
        console.error("Error fetching URL metadata:", error);
      }
      setInitialized(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const linkContent = content
    ? content.map((child, index) => <Renderer key={`${child.type}-${index}`} index={String(index)} node={child} />)
    : getDisplayUrl(url);

  return (
    <Tooltip
      variant="outlined"
      title={
        linkMetadata && (
          <div className="w-full max-w-64 sm:max-w-96 p-1 flex flex-col">
            <div className="w-full flex flex-row justify-start items-center gap-1">
              <img className="w-5 h-5 rounded" src={getFaviconWithGoogleS2(url)} alt={linkMetadata?.title} />
              <h3 className="text-base truncate dark:opacity-90">{linkMetadata?.title}</h3>
            </div>
            {linkMetadata.description && (
              <p className="mt-1 w-full text-sm leading-snug opacity-80 line-clamp-3">{linkMetadata.description}</p>
            )}
            {linkMetadata.image && (
              <img className="mt-1 w-full h-32 object-cover rounded" src={linkMetadata.image} alt={linkMetadata.title} />
            )}
          </div>
        )
      }
      open={showTooltip}
      arrow
    >
      <MLink
        className={"inline-flex items-center align-middle"}
        underline="hover"
        target="_blank"
        href={url}
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {favicon && (
          <img
            src={favicon}
            alt="favicon"
            className="w-4 h-4 mr-1.5 flex-shrink-0 align-text-bottom rounded-sm"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              setFavicon(undefined);
            }}
          />
        )}
        <span>{linkContent}</span>
      </MLink>

      {/* <MLink underline="always" target="_blank" href={url} rel="noopener noreferrer">
        <span onMouseEnter={handleMouseEnter} onMouseLeave={() => setShowTooltip(false)}>
          {content ? content.map((child, index) => <Renderer key={`${child.type}-${index}`} index={String(index)} node={child} />) : url}
        </span>
      </MLink> */}
    </Tooltip>
  );
};

export default Link;
