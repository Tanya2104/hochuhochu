import { Container } from '../../../components/ui/Container';
import { Card } from '../../../components/ui/Card';
import { profileMock } from '../mock';

export function ProfileHero() {
  return (
    <section className="py-6 sm:py-8">
      <Container>
        <Card className="rounded-3xl bg-rose-50/70 p-5 sm:p-7">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-rose-950 sm:text-4xl">
              {profileMock.name}
            </h1>
            <p className="text-sm font-medium text-rose-700/80">{profileMock.age} лет</p>
            <p className="text-base leading-relaxed text-rose-900/70">{profileMock.bio}</p>
          </div>
        </Card>
      </Container>
    </section>
  );
}
