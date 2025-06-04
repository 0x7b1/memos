import { observer } from "mobx-react-lite";
import MemoEditor from "@/components/MemoEditor";

const Home = observer(() => {
  return (
    <div className="w-full flex flex-col items-center pt-4 md:pt-8">
      <MemoEditor className="max-w-3xl w-full" cacheKey="home-memo-editor" autoFocus />
    </div>
  );
});

export default Home;
