/**
 * Central registry of tests → their spec section, level, category, and impl.
 * `node tests/manifest-data.js` regenerates the TTL manifests from this.
 */

export const CATEGORIES = {
  core: { label: 'Core CRUD Operations', comment: 'lws10-core create/read/update/delete, conditional requests, content PATCH, ranges, errors', tests: [
    ['post-creates-data-resource', 'POST creates a data resource', 'MUST', '9.2', 'core.test.js#postCreatesDataResource', 'POST to a container creates a data resource with 201 + Location + server-managed Link headers'],
    ['post-missing-container-404', 'POST to a missing container', 'MUST', '9.2', 'core.test.js#postToMissingContainer404', 'POST to a non-existent container returns 404'],
    ['get-content-etag', 'GET returns content and ETag', 'MUST', '9.1', 'core.test.js#getReturnsContentAndEtag', 'GET returns the resource content, Content-Type, and an ETag'],
    ['head-matches-get', 'HEAD returns headers without a body', 'MUST', '9.1', 'core.test.js#headMatchesGet', 'HEAD returns the same headers as GET with no body'],
    ['conditional-get-304', 'Conditional GET returns 304', 'MUST', '9.1', 'core.test.js#conditionalGet304', 'If-None-Match with the current ETag returns 304'],
    ['range-request-206', 'Range request returns 206', 'MUST', '9.1', 'core.test.js#rangeRequest206', 'A byte-range request returns 206 with Content-Range'],
    ['unconditional-put-428', 'Unconditional PUT rejected with 428', 'MUST', '9.3', 'core.test.js#unconditionalPut428', 'An ETag-supporting server rejects an unconditional PUT with 428'],
    ['stale-if-match-412', 'Stale If-Match rejected with 412', 'MUST', '9.3', 'core.test.js#staleIfMatch412', 'PUT with a non-matching If-Match returns 412'],
    ['valid-if-match-updates', 'Valid If-Match updates the resource', 'MUST', '9.3', 'core.test.js#validIfMatchUpdates', 'PUT with a matching If-Match returns 204 and a new ETag'],
    ['put-missing-404', 'PUT to a missing resource returns 404', 'MUST', '9.3', 'core.test.js#putToMissing404', 'PUT is update-only; a missing target returns 404'],
    ['content-merge-patch', 'Content PATCH via merge-patch', 'SHOULD', '9.3', 'core.test.js#contentMergePatch', 'PATCH with application/merge-patch+json updates a JSON resource'],
    ['merge-patch-non-json-415', 'merge-patch on non-JSON returns 415', 'SHOULD', '9.3', 'core.test.js#mergePatchNonJson415', 'merge-patch on a non-JSON resource returns 415'],
    ['delete-nonempty-409', 'DELETE non-empty container returns 409', 'MUST', '9.4', 'core.test.js#deleteNonEmptyContainer409', 'DELETE of a non-empty container without recursion returns 409'],
    ['recursive-delete', 'Recursive delete with Depth: infinity', 'MAY', '9.4', 'core.test.js#recursiveDelete', 'DELETE with Depth: infinity removes the container subtree'],
    ['errors-problem-json', 'Errors use problem+json', 'SHOULD', '9', 'core.test.js#errorsUseProblemJson', 'Error responses use RFC 9457 application/problem+json'],
  ] },
  containers: { label: 'Container Representation and Pagination', comment: 'lws10-core container model, membership, and pagination', tests: [
    ['container-representation', 'Container representation shape', 'MUST', '7', 'containers.test.js#containerRepresentation', 'A container GET returns @context/id/type/totalItems/items as application/lws+json'],
    ['item-description-fields', 'Contained resource description fields', 'MUST', '7', 'containers.test.js#itemDescriptionFields', 'Each item has id, type, mediaType (for DataResources), size, and modified'],
    ['containment-up-link', 'Containment expressed via rel=up', 'MUST', '7', 'containers.test.js#containmentUpLink', 'Non-root resources carry a Link rel="up" to their parent'],
    ['empty-container-items', 'Empty container has empty items', 'MUST', '7', 'containers.test.js#emptyContainerEmptyItems', 'An empty container has totalItems 0 and an empty items array'],
    ['pagination-links', 'Pagination Link relations', 'SHOULD', '6.2', 'containers.test.js#paginationLinks', 'A paginated container carries first/next Link headers; totalItems is the full count'],
    ['pagination-traversal', 'Pagination traversal is complete', 'SHOULD', '6.2', 'containers.test.js#paginationTraversal', 'Following rel="next" reassembles the full membership'],
  ] },
  metadata: { label: 'Metadata and Discovery', comment: 'lws10-core linkset resources (RFC 9264) and storage description discovery', tests: [
    ['linkset-discoverable', 'Linkset discoverable via rel=linkset', 'MUST', '8.1', 'metadata.test.js#linksetDiscoverable', 'Each resource advertises its linkset via a Link rel="linkset"'],
    ['linkset-shape', 'Linkset is application/linkset+json', 'MUST', '8.1', 'metadata.test.js#linksetShape', 'The linkset resource is RFC 9264 application/linkset+json with an anchor'],
    ['linkset-patch-advertised', 'Linkset advertises merge-patch', 'MUST', '8.1', 'metadata.test.js#linksetPatchAdvertised', 'The linkset advertises PATCH via Allow and Accept-Patch'],
    ['linkset-merge-patch', 'User-managed linkset PATCH', 'MUST', '8.1', 'metadata.test.js#linksetMergePatch', 'A merge-patch adds a user-managed link'],
    ['server-managed-protected', 'Server-managed links protected', 'MUST', '8.1', 'metadata.test.js#serverManagedLinkProtected', 'Patching a server-managed relation is rejected'],
    ['storage-description', 'Storage description discoverable', 'MUST', '5', 'metadata.test.js#storageDescriptionDiscoverable', 'The storage description is discoverable via Link and lists a StorageDescription service'],
  ] },
  'media-type': { label: 'LWS Media Type and Content Negotiation', comment: 'lws10-core application/lws+json and conneg', tests: [
    ['lws-json-content-type', 'application/lws+json response', 'MUST', '6.1', 'media-type.test.js#lwsJsonContentType', 'A container request for application/lws+json is served as such'],
    ['ld-json-negotiation', 'application/ld+json negotiation', 'MUST', '6.1', 'media-type.test.js#ldJsonNegotiation', 'A request for application/ld+json is served as such'],
    ['plain-json-negotiation', 'application/json negotiation', 'MUST', '6.1', 'media-type.test.js#plainJsonNegotiation', 'A request for application/json is served as such'],
    ['ld-json-profile', 'ld+json;profile equivalence', 'SHOULD', '6.1', 'media-type.test.js#ldJsonProfileEquivalence', 'application/ld+json;profile is treated as application/lws+json'],
    ['vary-accept', 'Vary: Accept advertised', 'SHOULD', '7', 'media-type.test.js#varyAcceptHeader', 'Container responses advertise Vary: Accept'],
    ['identical-body', 'Body identical across media types', 'MUST', '6.1', 'media-type.test.js#identicalBodyAcrossMediaTypes', 'Only Content-Type varies across negotiated media types'],
  ] },
  searchindex: { label: 'Type Index and Type Search', comment: 'lws10-searchindex TypeIndexService and TypeSearchService', tests: [
    ['type-index-advertised', 'TypeIndexService advertised', 'MUST', '4', 'searchindex.test.js#typeIndexAdvertised', 'TypeIndexService is advertised in the storage description'],
    ['type-index-lists', 'Type index lists declared types', 'MUST', '5', 'searchindex.test.js#typeIndexLists', 'A type declared via a Link header appears in the type index'],
    ['type-search-single', 'Type search by single type', 'MUST', '6', 'searchindex.test.js#typeSearchSingleType', 'TypeSearch GET returns resources declaring the given type'],
    ['type-search-native', 'Native Container class filter', 'MUST', '6', 'searchindex.test.js#typeSearchNativeContainerClass', 'Filtering on lws#Container matches container resources'],
    ['type-search-post-cnf', 'Type search POST CNF filter', 'MUST', '6', 'searchindex.test.js#typeSearchPostCnf', 'TypeSearch POST supports the conjunctive-normal-form filter'],
    ['type-search-no-match', 'No match yields empty result', 'MUST', '6', 'searchindex.test.js#typeSearchNoMatchEmpty', 'A well-formed no-match query returns 200 with empty items'],
    ['type-search-invalid-uri', 'Invalid URI value returns 400', 'MUST', '6', 'searchindex.test.js#typeSearchInvalidUri400', 'A non-absolute-URI filter value returns 400'],
    ['type-search-wrong-media', 'POST wrong media type returns 415', 'MUST', '6', 'searchindex.test.js#typeSearchWrongMediaType415', 'A POST body of the wrong media type returns 415'],
    ['type-search-malformed', 'Malformed body returns 400', 'MUST', '6', 'searchindex.test.js#typeSearchMalformedBody400', 'A malformed type value returns 400'],
    ['type-index-drops-deleted', 'Deleted resource dropped', 'SHOULD', '5', 'searchindex.test.js#typeIndexDropsDeleted', 'A deleted resource is dropped from search results'],
  ] },
  notifications: { label: 'Webhook Notifications', comment: 'lws10-notifications subscriptions, envelopes, and RFC 9421 signatures', tests: [
    ['notification-service', 'NotificationService advertised', 'MUST', '4', 'notifications.test.js#notificationServiceAdvertised', 'NotificationService is advertised in the storage description'],
    ['subscription-lifecycle', 'Subscription create/get/delete', 'MUST', '6', 'notifications.test.js#subscriptionLifecycle', 'A webhook subscription can be created, read, and deleted'],
    ['webhook-signature', 'Signed webhook delivery', 'SHOULD', '7', 'notifications.test.js#webhookDeliveryAndSignature', 'A change delivers an AS2 envelope signed per RFC 9421, verifiable against the published key'],
  ] },
  authn: { label: 'Authentication (self-issued did:key)', comment: 'lws10-authn-ssi-did-key credentials', tests: [
    ['anon-write-challenged', 'Anonymous write challenged', 'MUST', 'Authorization', 'authn.test.js#anonWriteChallenged', 'An anonymous write returns 401 with a conforming WWW-Authenticate challenge'],
    ['valid-did-key', 'Valid did:key JWT accepted', 'MUST', 'Authentication', 'authn.test.js#validDidKeyAccepted', 'A valid self-issued did:key JWT is accepted'],
    ['expired-rejected', 'Expired credential rejected', 'MUST', 'Authentication', 'authn.test.js#expiredRejected', 'An expired JWT is rejected'],
    ['tampered-rejected', 'Tampered credential rejected', 'MUST', 'Authentication', 'authn.test.js#tamperedRejected', 'A JWT with a broken signature is rejected'],
    ['subject-mismatch', 'sub/iss mismatch rejected', 'MUST', 'Authentication', 'authn.test.js#subjectMismatchRejected', 'A JWT whose sub != iss is rejected'],
    ['unauthorized-agent', 'Unauthorized agent forbidden', 'MUST', 'Authorization', 'authn.test.js#unauthorizedAgentForbidden', 'A valid but unlisted agent is forbidden (403)'],
  ] },
  authz: { label: 'Authorization (ODRL access grants)', comment: 'lws-access-requests ODRL Access Profile', tests: [
    ['admin-can-write', 'Admin can write', 'MUST', 'Authorization', 'authz.test.js#adminCanWrite', 'An allowlisted controller can create resources'],
    ['anon-read-refused', 'Anonymous read refused', 'MUST', 'Authorization', 'authz.test.js#anonReadRefused', 'With reads gated, an anonymous read returns 401'],
    ['ungranted-forbidden', 'Ungranted agent forbidden', 'MUST', 'Authorization', 'authz.test.js#ungrantedAgentForbidden', 'An authenticated agent without a grant is forbidden'],
    ['read-grant-allows', 'Read grant allows read', 'MUST', 'Authorization', 'authz.test.js#readGrantAllows', 'A read grant permits the assignee to read'],
    ['read-grant-denies-write', 'Read grant denies write', 'MUST', 'Authorization', 'authz.test.js#readGrantDeniesWrite', 'A read-only grant does not permit writes'],
    ['public-grant-anon', 'foaf:Agent grant allows anon', 'MUST', 'Authorization', 'authz.test.js#publicGrantAllowsAnon', 'A grant to foaf:Agent permits anonymous reads'],
    ['expired-datetime', 'Expired dateTime constraint denies', 'MUST', 'Authorization', 'authz.test.js#expiredDateTimeConstraintDenies', 'A grant whose dateTime window has closed denies access'],
    ['open-datetime', 'Open dateTime constraint allows', 'MUST', 'Authorization', 'authz.test.js#openDateTimeConstraintAllows', 'A grant whose dateTime window is open permits access'],
    ['create-grant', 'Create grant allows POST', 'MUST', 'Authorization', 'authz.test.js#createGrantAllowsPost', 'A create grant permits POST into a container'],
    ['search-filtered', 'Search authorization filtering', 'MUST', 'Authorization', 'authz.test.js#searchAuthorizationFiltered', 'Type search results are limited to what the client may read'],
  ] },
};

function ttlEscape(s) { return s.replace(/"/g, '\\"'); }

function manifestTtl(cat, data) {
  const entries = data.tests.map(([id]) => `    <#${id}>`).join('\n');
  const blocks = data.tests.map(([id, name, level, section, impl, comment]) => `
<#${id}>
  rdf:type lws:ProtocolTest ;
  mf:name "${ttlEscape(name)}" ;
  rdfs:comment "${ttlEscape(comment)}" ;
  lws:specSection "${section}" ;
  lws:conformanceLevel "${level}" ;
  lws:category "${cat}" ;
  lws:testImplementation "tests/${impl}" .`).join('\n');
  return `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#> .
@prefix lws: <https://w3c.github.io/lws-protocol/test-vocab#> .

<>
  rdf:type mf:Manifest ;
  rdfs:label "${ttlEscape(data.label)}" ;
  rdfs:comment "${ttlEscape(data.comment)}" ;
  mf:entries (
${entries}
  ) .
${blocks}
`;
}

function rootTtl() {
  const includes = Object.keys(CATEGORIES).map((c) => `    <${c}-manifest.ttl>`).join('\n');
  return `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#> .
@prefix lws: <https://w3c.github.io/lws-protocol/test-vocab#> .
@prefix dc: <http://purl.org/dc/terms/> .

<>
  rdf:type mf:Manifest ;
  rdfs:label "LWS Protocol Test Suite" ;
  rdfs:comment "W3C Linked Web Storage Protocol conformance tests — current editor's drafts (core, searchindex, notifications, authn, authz)" ;
  dc:creator "W3C LWS Working Group" ;
  mf:include (
${includes}
  ) .
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFileSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const mDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'manifests');
  writeFileSync(join(mDir, 'manifest.ttl'), rootTtl());
  for (const [cat, data] of Object.entries(CATEGORIES)) {
    writeFileSync(join(mDir, `${cat}-manifest.ttl`), manifestTtl(cat, data));
  }
  console.log(`wrote ${Object.keys(CATEGORIES).length + 1} manifests`);
}
