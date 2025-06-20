create table if not exists usuario(
  id int generated always as identity primary key,
  nome varchar(70) not null,
  email varchar(100) not null,
  senha varchar(100) not null
);

alter table usuario
add column role user_role default 'user';

create table if not exists servicos(
  id_serv int generated always as identity primary key,
  nome_serv varchar(100) not null,
  descricao varchar(500) not null
);

create table if not exists agendamentos(
  id_agend int generated always as identity primary key,
  id_usuario int,
  id_servico int,
  data date not null,
  hora time not null,
  status varchar(20) not null,
  foreign key(id_usuario) references usuario(id),
  foreign key(id_servico) references servicos(id_serv)
);

alter table agendamentos alter column status set default 'pendente';

create table if not exists contatos(
  id_contato int generated always as identity primary key,
  id_usuario int,
  nome_usuario varchar(70) not null,
  email_usuario varchar(100) not null,
  assunto varchar(200) not null,
  mensagem text not null,
  categoria varchar(50) default 'geral',
  status varchar(20) default 'pendente',
  resposta_admin text,
  data_criacao date default now(),
  data_resposta date,
  foreign key(id_usuario) references usuario(id)
);

-- Para listar agendamentos com informações completas
create or replace view v_agendamentos_completos as
select
  a.id_agend,
  u.nome as nome_usuario,
  u.email as email_usuario,
  s.nome_serv,
  s.descricao as descricao_servico,
  a.data,
  a.hora,
  a.status
from agendamentos a
join usuario u on a.id_usuario = u.id
join servicos s on a.id_servico = s.id_serv
order by a.data desc, a.hora desc;

-- Para dashboard administrativo
create or replace view v_dashboard_admin as
select
  (select count(*) from usuario) as total_usuarios,
  (select count(*) from agendamentos where status = 'pendente') as agendamentos_pendentes,
  (select count(*) from agendamentos where status = 'confirmado') as agendamentos_confirmados,
  (select count(*) from contatos where status = 'pendente') as contatos_pendentes,
  (select count(*) from servicos) as total_servicos;


-- Para relatorio de contatos
create or replace view v_contatos_detalhados as
select
  c.id_contato,
  coalesce(u.nome, c.nome_usuario) as nome_usuario,
  coalesce(u.email, c.email_usuario) as email_usuario,
  c.assunto,
  c.categoria,
  c.status,
  c.data_criacao,
  c.data_resposta,
  case
    when c.data_resposta is not null
    then c.data_resposta - c.data_criacao
    else null
  end as tempo_resposta_dias
from contatos c
left join usuario u on c.id_usuario = u.id
order by c.data_criacao desc;


-- Para verificar disponibilidade de horario
create or replace function verificar_disponibilidade(
  p_data date,
  p_hora time,
  p_id_servico int
) returns boolean as $$
begin
  return not exists(
    select 1 from agendamentos
    where data = p_data
    and hora = p_hora
    and id_servico = p_id_servico
    and status in ('confirmado', 'pendente')
  );
end;
$$ language plpgsql;


-- Para buscar usuario por email
create or replace function buscar_usuario_por_email(
  p_email varchar(100)
) returns table(
  id_usuario int,
  nome_usuario varchar(70),
  email_usuario varchar(100),
  role_usuario user_role,
  total_agendamentos bigint,
  total_contatos bigint
) as $$
begin
  return query
  select
    u.id,
    u.nome,
    u.email,
    u.role,
    (select count(*) from agendamentos where id_usuario = u.id),
    (select count(*) from contatos where id_usuario = u.id)
  from usuario u
  where lower(u.email) = lower(p_email);
end;
$$ language plpgsql;


-- Para agendar serviços com validações
create or replace procedure agendar_servico(
  p_id_usuario int,
  p_id_servico int,
  p_data date,
  p_hora time
) as $$
begin
  if not exists(select 1 from usuario where id = p_id_usuario) then
    raise exception 'usuario não encontrado';
  end if;

  if not exists(select 1 from servicos where id_serv = p_id_servico) then
    raise exception 'serviço não encontrado';
  end if;

  if p_data < current_date then
    raise exception 'não é possivel agendar para datas passadas';
  end if;

  if not verificar_disponibilidade(p_data, p_hora, p_id_servico) then
    raise exception 'horario não disponivel para este serviço';
  end if;

  insert into agendamentos (id_usuario, id_servico, data, hora, status)
  values (p_id_usuario, p_id_servico, p_data, p_hora, 'pendente');

  raise notice 'agendamento realizado com sucesso!';
end;
$$ language plpgsql;


-- Para responder contato
create or replace procedure responder_contato(
  p_id_contato int,
  p_resposta text
) as $$
begin
  if not exists(select 1 from contatos where id_contato = p_id_contato) then
    raise exception 'contato não encontrado';
  end if;

  update contatos
  set
    resposta_admin = p_resposta,
    status = 'respondido',
    data_respsota = current_date
  where id_contato = p_id_contato;

  raise notice 'resposta registrada com sucesso!';
end;
$$ language plpgsql;


insert into usuario (nome, email, senha, role) 
values
('João Silva', 'joao@email.com', 'senha123', 'user'),
('Maria Santos', 'maria@email.com', 'senha456', 'user'),
('Admin Sistema', 'admin@sistema.com', 'admin123', 'admin'),
('Carlos Oliveira', 'carlos@email.com', 'senha789', 'user'),
('Ana Costa', 'ana@email.com', 'senha321', 'user');

insert into servicos (nome_serv, descricao) 
values
('Atendimento Psicológico', 'Sessões de apoio psicológico com proficionais qualificados'),
('Consulta Jurídica', 'Atendimento jurídico especializado');

insert into agendamentos (id_usuario, id_servico, data, hora, status) 
values
(1, 1, '2025-06-01', '14:00', 'pendente'),
(9, 1, '2025-06-21', '09:00', 'agendado'),
(8, 1, '2025-06-25', '10:00', 'agendado'),
(8, 1, '2025-06-10', '09:00', 'agendado'),
(11, 2, '2025-06-12', '09:00', 'agendado');

insert into contatos (id_usuario, nome_usuario, email_usuario, assunto, mensagem, categoria) 
values
(6, 'flavinho', 'flavinho@email.com', 'Dúvida sobre agendamento', 'Gostaria de saber como cancelar meu agendamento', 'agendamento');
