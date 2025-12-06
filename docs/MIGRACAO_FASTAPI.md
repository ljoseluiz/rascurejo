# Guia de Migração: Express → FastAPI

## 📋 Índice
1. [Configuração Inicial](#1-configuração-inicial)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Autenticação e CSRF](#3-autenticação-e-csrf)
4. [Endpoints de Produtos](#4-endpoints-de-produtos)
5. [Endpoints de Vendas](#5-endpoints-de-vendas)
6. [Banco de Dados](#6-banco-de-dados)
7. [Deploy](#7-deploy)

---

## 1. Configuração Inicial

### 1.1 Instalar Dependências

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-jose[cryptography] passlib[bcrypt] python-multipart pydantic-settings
```

### 1.2 Criar `requirements.txt`

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic-settings==2.1.0
python-dotenv==1.0.0
```

---

## 2. Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app principal
│   ├── config.py            # Configurações (env vars)
│   ├── database.py          # Conexão SQLAlchemy
│   ├── models/              # SQLAlchemy Models
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   └── user.py
│   ├── schemas/             # Pydantic Schemas (validação)
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   └── user.py
│   ├── routers/             # Endpoints (organizados por módulo)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── sales.py
│   │   └── stats.py
│   ├── services/            # Lógica de negócio
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   └── product_service.py
│   └── utils/
│       ├── __init__.py
│       ├── auth.py          # JWT helpers
│       └── security.py      # Password hashing
├── tests/
├── alembic/                 # Migrations
├── .env
└── requirements.txt
```

---

## 3. Autenticação e CSRF

### 3.1 `app/config.py` - Configurações

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/varejix"
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:5174"]
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
```

### 3.2 `app/utils/auth.py` - JWT Helpers

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

### 3.3 `app/database.py` - Conexão DB

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 4. Endpoints de Produtos

### 4.1 `app/models/product.py` - Model SQLAlchemy

```python
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    sku = Column(String, unique=True, nullable=False, index=True)
    barcode = Column(String, unique=True, nullable=True)
    category = Column(String, index=True)
    subcategory = Column(String)
    brand = Column(String)
    supplier = Column(String)
    description = Column(String)
    
    # Preços como JSONB
    prices = Column(JSON, default={"sale": 0, "promotion": 0, "wholesale": 0})
    
    unit = Column(String, default="un")
    stock = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    
    # Imagens e variações
    images = Column(JSON, default=[])
    variations = Column(JSON, default=[])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### 4.2 `app/schemas/product.py` - Pydantic Schema

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class PriceSchema(BaseModel):
    sale: float
    promotion: Optional[float] = 0
    wholesale: Optional[float] = 0

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sku: str = Field(..., min_length=1, max_length=50)
    barcode: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    supplier: Optional[str] = None
    description: Optional[str] = None
    prices: PriceSchema
    unit: str = "un"
    stock: int = 0
    active: bool = True
    images: List[Dict] = []
    variations: List[Dict] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    prices: Optional[PriceSchema] = None
    stock: Optional[int] = None
    active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

### 4.3 `app/routers/products.py` - Endpoints

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Lista produtos com filtros e paginação"""
    query = db.query(Product)
    
    # Filtros
    if q:
        query = query.filter(
            (Product.name.ilike(f"%{q}%")) | 
            (Product.sku.ilike(f"%{q}%"))
        )
    if category:
        query = query.filter(Product.category == category)
    if brand:
        query = query.filter(Product.brand == brand)
    if active is not None:
        query = query.filter(Product.active == active)
    
    # Paginação
    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()
    
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Busca produto por ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product

@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cria novo produto (requer autenticação)"""
    # Validar SKU único
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU já existe")
    
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualiza produto (requer autenticação)"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Atualizar apenas campos fornecidos
    for field, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Deleta produto (requer autenticação)"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db.delete(db_product)
    db.commit()
    return None
```

---

## 5. Endpoints de Vendas

### 5.1 `app/models/sale.py` - Model

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class SaleStatus(str, enum.Enum):
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RETURNED = "returned"

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    customer_name = Column(String)
    customer_cpf = Column(String)
    seller_id = Column(Integer, ForeignKey("sellers.id"))
    
    channel = Column(String)  # presencial, online
    payment_method = Column(String)
    
    subtotal = Column(Float)
    discount = Column(Float, default=0)
    tax = Column(Float)
    total = Column(Float)
    
    status = Column(Enum(SaleStatus), default=SaleStatus.COMPLETED)
    notes = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String)
    
    # Relacionamentos
    items = relationship("SaleItem", back_populates="sale")
    seller = relationship("Seller", back_populates="sales")

class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    product_name = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)
    total = Column(Float)
    
    # Relacionamentos
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
```

### 5.2 `app/routers/sales.py` - Endpoints

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, datetime
from app.database import get_db
from app.models.sale import Sale, SaleItem, SaleStatus
from app.models.product import Product
from app.schemas.sale import SaleCreate, SaleResponse

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("/", response_model=SaleResponse, status_code=201)
async def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cria nova venda com atualização automática de estoque"""
    
    # Validar estoque e calcular totais
    subtotal = 0
    sale_items = []
    
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produto {item.product_id} não encontrado")
        
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Estoque insuficiente para {product.name}"
            )
        
        item_total = product.prices["sale"] * item.quantity
        subtotal += item_total
        
        sale_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item.quantity,
            "unit_price": product.prices["sale"],
            "total": item_total
        })
    
    # Calcular impostos e total
    discount = sale.discount or 0
    tax = (subtotal - discount) * 0.08  # 8% de impostos
    total = subtotal - discount + tax
    
    # Criar venda
    db_sale = Sale(
        customer_name=sale.customer_name,
        customer_cpf=sale.customer_cpf,
        seller_id=sale.seller_id,
        channel=sale.channel,
        payment_method=sale.payment_method,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        notes=sale.notes,
        created_by=current_user["username"]
    )
    db.add(db_sale)
    db.flush()  # Obter ID da venda
    
    # Criar itens e baixar estoque
    for item_data in sale_items:
        db_item = SaleItem(sale_id=db_sale.id, **item_data)
        db.add(db_item)
        
        # Baixar estoque
        product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
        product.stock -= item_data["quantity"]
    
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.get("/stats")
async def sales_stats(db: Session = Depends(get_db)):
    """Estatísticas de vendas (hoje, total, ticket médio, top sellers)"""
    today = date.today()
    
    # Vendas de hoje
    today_sales = db.query(Sale).filter(
        func.date(Sale.date) == today,
        Sale.status == SaleStatus.COMPLETED
    ).all()
    
    # Todas as vendas
    total_sales = db.query(Sale).filter(Sale.status == SaleStatus.COMPLETED).all()
    
    today_revenue = sum(s.total for s in today_sales)
    total_revenue = sum(s.total for s in total_sales)
    avg_ticket = total_revenue / len(total_sales) if total_sales else 0
    
    # Top vendedores
    top_sellers = db.query(
        Sale.seller_id,
        func.count(Sale.id).label("total_sales"),
        func.sum(Sale.total).label("total_revenue")
    ).filter(
        Sale.status == SaleStatus.COMPLETED
    ).group_by(Sale.seller_id).order_by(
        func.sum(Sale.total).desc()
    ).limit(5).all()
    
    return {
        "today_sales": len(today_sales),
        "today_revenue": today_revenue,
        "total_sales": len(total_sales),
        "total_revenue": total_revenue,
        "avg_ticket": avg_ticket,
        "cancelled_sales": db.query(Sale).filter(Sale.status == SaleStatus.CANCELLED).count(),
        "top_sellers": [
            {
                "seller_id": s.seller_id,
                "total_sales": s.total_sales,
                "total_revenue": s.total_revenue
            } for s in top_sellers
        ]
    }
```

---

## 6. Banco de Dados

### 6.1 Migrations com Alembic

```bash
# Instalar Alembic
pip install alembic

# Inicializar
alembic init alembic

# Editar alembic.ini
sqlalchemy.url = postgresql://user:password@localhost/varejix

# Criar primeira migration
alembic revision --autogenerate -m "Initial tables"

# Aplicar migrations
alembic upgrade head
```

### 6.2 `app/main.py` - App Principal

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, products, sales, stats

settings = get_settings()

app = FastAPI(
    title="Varejix API",
    description="Sistema de Gestão Comercial",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(stats.router)

@app.get("/")
async def root():
    return {"message": "Varejix API v2.0", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

---

## 7. Deploy

### 7.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 7.2 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://varejix:password@db:5432/varejix
      - SECRET_KEY=your-secret-key-here
    depends_on:
      - db
    volumes:
      - ./app:/app/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=varejix
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=varejix
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 7.3 Rodar

```bash
# Desenvolvimento
uvicorn app.main:app --reload --port 8000

# Docker
docker-compose up -d

# Acessar docs
http://localhost:8000/docs
```

---

## 📊 Comparação: Express vs FastAPI

| Recurso | Express (Atual) | FastAPI |
|---------|-----------------|---------|
| **Performance** | ~1k req/s | ~10k req/s |
| **Validação** | Manual | Automática (Pydantic) |
| **Documentação** | Manual | Auto-gerada (/docs) |
| **Type Hints** | ❌ | ✅ |
| **Async/Await** | Parcial | Nativo |
| **ORM** | Sequelize/Prisma | SQLAlchemy |
| **Testes** | Jest | Pytest |
| **Deploy** | Node 20MB | Python 50MB (slim) |

---

## ✅ Checklist de Migração

- [ ] Configurar ambiente Python + venv
- [ ] Criar estrutura de pastas
- [ ] Configurar database.py + SQLAlchemy
- [ ] Migrar models (Product, Sale, User)
- [ ] Criar schemas Pydantic
- [ ] Migrar endpoints de autenticação
- [ ] Migrar endpoints de produtos
- [ ] Migrar endpoints de vendas
- [ ] Testar endpoints no /docs
- [ ] Configurar CORS
- [ ] Testar integração com frontend React
- [ ] Criar migrations (Alembic)
- [ ] Configurar Docker
- [ ] Deploy

---

## 🚀 Próximos Passos

1. **Semana 1:** Setup + Models + Schemas
2. **Semana 2:** Auth + Produtos + Vendas
3. **Semana 3:** Testes + Deploy
4. **Semana 4:** Otimizações + Cache (Redis)

**Tempo estimado:** 3-4 semanas part-time

---

## 📚 Recursos

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/)
- [Pydantic Guide](https://docs.pydantic.dev/latest/)
- [Alembic Docs](https://alembic.sqlalchemy.org/)

---

**Precisa de ajuda com algum módulo específico? Posso gerar o código completo!**
