import { LandingFaqItems } from './LandingLists'

export function LandingFaq() {
  return (
    <section id="faq" data-screen-label="S10 FAQ">
      <div className="fq">
        <div className="fqL">
          <h2>자주 묻는 질문</h2>
          <a href="#faq">더 궁금한 건 끼루 AI 챗봇에게 물어보세요 →</a>
        </div>
        <div className="fqR" id="fqR">
          <LandingFaqItems />
        </div>
      </div>
    </section>
  )
}
